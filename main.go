package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/compress"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	app := fiber.New(fiber.Config{
		AppName: "techEdilite",
	})

	app.Use(logger.New())
	app.Use(compress.New())

	// Clean routes for each page.
	pages := map[string]string{
		"/":               "index.html",
		"/careers":        "careers.html",
		"/case-studies":   "CaseStudies.html",
		"/consultation":   "consultation.html",
		"/fintrase":       "fintrase.html",
		"/privacy-policy": "privacyPolicy.html",
		"/terms-service":  "termsService.html",
	}
	for route, file := range pages {
		file := file
		app.Get(route, func(c *fiber.Ctx) error {
			return c.SendFile(file)
		})
	}

	app.Get("/assets/job", func(c *fiber.Ctx) error {
		return c.SendFile("assets/job.html")
	})

	// Static assets (images, css, video, etc).
	app.Static("/assets", "./assets")
	app.Static("/style.css", "./style.css")

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}
	log.Fatal(app.Listen(":" + port))
}
