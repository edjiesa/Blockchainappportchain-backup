FROM golang:1.22-alpine

WORKDIR /app

# Copy go mod files
COPY go.mod ./
# COPY go.sum ./
# RUN go mod download

# Copy source
COPY . .

# Generate go.sum and download dependencies
RUN go mod tidy

# Build
RUN go build -o main .

# Run
CMD ["./main"]
