import createApp from "./src/infrastructure/http/server";

const PORT = Number.parseInt(process.env.PORT ?? "4000", 10);

const app = createApp();

const server = app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});

const shutdown = async () => {
	console.log("Shutting down...");
	server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
