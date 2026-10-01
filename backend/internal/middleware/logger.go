package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
)

// Logger returns a Gin middleware that logs each request with duration and status.
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		latency := time.Since(start)
		gin.DefaultWriter.Write([]byte(
			time.Now().Format(time.RFC3339) + " | " +
				c.Request.Method + " " + c.Request.URL.Path + " | " +
				time.Duration(latency).String() + " | " +
				c.ClientIP() + "\n",
		))
	}
}
