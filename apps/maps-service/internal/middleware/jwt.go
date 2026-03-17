package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type JWTClaims struct {
	Sub        string                 `json:"sub"`
	Email      string                 `json:"email"`
	TrustLevel int                    `json:"trust_level"`
	Permissions map[string]bool       `json:"permissions"`
	OrgID      *string                `json:"org_id"`
	jwt.RegisteredClaims
}

func JWTAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token no encontrado"})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Formato de token inválido"})
			c.Abort()
			return
		}

		tokenStr := parts[1]
		secret := os.Getenv("JWT_SECRET")

		claims := &JWTClaims{}
		token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token inválido o expirado"})
			c.Abort()
			return
		}

		c.Set("user_id", claims.Sub)
		c.Set("email", claims.Email)
		c.Set("trust_level", claims.TrustLevel)
		c.Set("permissions", claims.Permissions)
		c.Set("org_id", claims.OrgID)

		c.Next()
	}
}

func RequirePermission(permission string) gin.HandlerFunc {
	return func(c *gin.Context) {
		trustLevel, _ := c.Get("trust_level")
		if trustLevel.(int) == 3 {
			c.Next()
			return
		}

		permissions, exists := c.Get("permissions")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Sin permisos"})
			c.Abort()
			return
		}

		perms := permissions.(map[string]bool)
		if !perms[permission] {
			c.JSON(http.StatusForbidden, gin.H{"error": "Permiso requerido: " + permission})
			c.Abort()
			return
		}

		c.Next()
	}
}