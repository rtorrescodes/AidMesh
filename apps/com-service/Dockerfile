FROM golang:1.23-alpine AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o server ./cmd/server

FROM alpine:latest AS prod
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=build /app/server .
EXPOSE 3004
CMD ["./server"]