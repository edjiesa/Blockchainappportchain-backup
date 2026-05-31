FROM golang:1.22-alpine

WORKDIR /app

# Copy go mod files
COPY go.mod ./
# COPY go.sum ./
# RUN go mod download

# Copy source
COPY . .

# Build
RUN go build -o main .

# Run
CMD ["./main"]
