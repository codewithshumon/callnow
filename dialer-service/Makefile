.PHONY: build run test lint fmt docker-build

build:
	go build -o bin/dialer cmd/server/main.go

run:
	go run cmd/server/main.go

test:
	go test -v ./... -race -cover

fmt:
	go fmt ./...

docker-build:
	docker build -t voicelink-dialer .
