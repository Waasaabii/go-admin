# syntax=docker/dockerfile:1.7

FROM golang:1.24-alpine AS builder

WORKDIR /src

ENV GOPROXY=https://goproxy.cn,direct \
  GOMODCACHE=/go/pkg/mod \
  GOCACHE=/root/.cache/go-build

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories \
  && apk add --no-cache git

COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod,sharing=locked \
  --mount=type=cache,target=/root/.cache/go-build,sharing=locked \
  go mod download

COPY . .

RUN --mount=type=cache,target=/go/pkg/mod,sharing=locked \
  --mount=type=cache,target=/root/.cache/go-build,sharing=locked \
  CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
  go build -ldflags "-s -w" -o /out/go-admin .

FROM alpine

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories \
  && apk add --no-cache ca-certificates tzdata

ENV TZ=Asia/Shanghai

COPY --from=builder /out/go-admin /go-admin
# settings.yml 仅作为容器内示例配置；真正的安装完成标志是同目录下的 .installed。
COPY ./config/settings.demo.yml /config/settings.yml
COPY ./go-admin-db.db /go-admin-db.db
RUN chmod +x /go-admin \
  && sed -i 's/port: 18123/port: 8000/' /config/settings.yml

EXPOSE 8000

CMD ["/go-admin", "server", "-c", "/config/settings.yml"]
