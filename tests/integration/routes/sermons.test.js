const request = require("supertest");
const mongoose = require("mongoose");
const fs = require("fs");

const Sermon = require("../../../models/sermon");
const User = require("../../../models/user");

let server;
let sermons;
let id;
let token;

describe("/api/sermons", () => {
    beforeEach(async () => {
        server = require("../../../server");
    
        sermons = [
            new Sermon({
                title: "Test Sermon 1",
                scripture: "Test Scripture 1",
                speaker: "Test Speaker 1",
                date: Date.now().toString(),
                mp3: "test-1.mp3"
            }),
            new Sermon({
                title: "Test Sermon 2",
                scripture: "Test Scripture 2",
                speaker: "Test Speaker 2",
                date: Date.now().toString(),
                mp3: "test-2.mp3"
            }),
            new Sermon({
                title: "Test Sermon 3",
                scripture: "Test Scripture 3",
                speaker: "Test Speaker 3",
                date: Date.now().toString(),
                mp3: "test-3.mp3"
            })
        ];
    
        await Sermon.insertMany(sermons);
    });
    
    afterEach(async () => {
        await server.close();
        await Sermon.remove({});
    });

    describe("GET /", () => {
        it("should return all sermons", async () => {
            const res = await request(server).get("/api/sermons");

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("sermons");
            expect(res.body.sermons.some(sermon => sermon.name == sermons[0].name)).toBeTruthy();
            expect(res.body.sermons.length).toBe(sermons.length);
        });
    });

    describe("GET /limit/:number", () => {
        it("should limit the returned sermons by the given number", async () => {
            const res = await request(server).get("/api/sermons/limit/1");

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("sermons");
            expect(res.body.sermons.length).toBe(1);
        });

        it("should limit the returned sermons to a default of 3 when an invalid number is given", async () => {
            const res = await request(server).get("/api/sermons/limit/test");

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("sermons");
            expect(res.body.sermons.length).toBe(3);
        });
    });

    describe("GET /:id", () => {
        it("should return a sermon with the given ID", async () => {
            const res = await request(server).get("/api/sermons/" + sermons[0]._id);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("sermon");
            expect(res.body.sermon).toHaveProperty("name", sermons[0].name);
        });

        it("should return a 500 error if the given ID is not valid", async () => {
            const res = await request(server).get("/api/sermons/1");

            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty("error");
        });

        it("should return a 404 status if a sermon cannot be found with the given ID", async () => {
            id = mongoose.Types.ObjectId();

            const res = await request(server).get("/api/sermons/" + id);

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty("error");
        });
    });

    describe("POST /", () => {
        let testSermon;
        let mp3FilePath;

        beforeEach(() => {
            testSermon = {
                title: "Test Sermon",
                scripture: "Test Scripture",
                speaker: "Test Speaker",
                date: Date.now().toString(),
                mp3: "test.mp3"
            };

            mp3FilePath = "./tests/mp3/test.mp3";

            token = new User().generateAuthToken();
        });

        afterEach(() => {
            fs.unlinkSync("./mp3/testmp.mp3");
        });

        it("should create a new sermon and return it with a 201 status", async () => {
            const res = await request(server)
                    .post("/api/sermons")
                    .set("authorization", "Bearer " + token)
                    .set('Content-Type', 'multipart/form-data')
                    .field("title", testSermon.title)
                    .field("scripture", testSermon.scripture)
                    .field("speaker", testSermon.speaker)
                    .field("date", testSermon.date)
                    .attach("mp3", mp3FilePath);

            expect(res.status).toBe(201);
        });

        it("should return a 400 status if the limit of 10 sermons has been reached", async () => {
            let newSermons = [];
            for (let i = 0; i < 10; i++) {
                const sermon = {
                    title: "Added Sermon " + i,
                    scripture: "Added Scripture " + i,
                    speaker: "Added Speaker " + i,
                    date: Date.now().toString(),
                    mp3: "added-test-" + i + ".mp3"
                };
                newSermons.push(sermon);
            }

            await Sermon.insertMany(newSermons);

            const res = await request(server)
                .post("/api/sermons")
                .set("authorization", "Bearer " + token)
                .set('Content-Type', 'multipart/form-data')
                .field("title", testSermon.title)
                .field("scripture", testSermon.scripture)
                .field("speaker", testSermon.speaker)
                .field("date", testSermon.date)
                .attach("mp3", mp3FilePath);

            expect(res.status).toBe(400);
        });
    });

    describe("PUT /:id", () => {
        let updatedSermon;

        beforeEach(() => {
            updatedSermon = {
                id: sermons[0]._id,
                title: "Test Sermon 1000",
                scripture: "Test Scripture 1000",
                speaker: "Test Speaker 1000",
                date: Date.now().toString(),
                mp3: "test-1000.mp3"
            };

            token = new User().generateAuthToken();
        });

        it("should return a 200 status with the newly updated sermon", async () => {
            const res = await request(server).put("/api/sermons/" + updatedSermon.id).set("authorization", "Bearer " + token).send(updatedSermon);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("sermon");
            expect(res.body.sermon).toHaveProperty("name", updatedSermon.name);
        });

        it("should return a 404 status if there is no match for the given ID", async () => {
            id = mongoose.Types.ObjectId();

            const res = await request(server).put("/api/sermons/" + id).set("authorization", "Bearer " + token).send(updatedSermon);

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty("error");
        });

        it("should return a 500 error if an invalid ID is given", async () => {
            const res = await request(server).put("/api/sermons/1").set("authorization", "Bearer " + token).send(updatedSermon);

            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty("error");
        });

        it("should return a 401 status if the user is not authorized", async () => {
            const res = await request(server).put("/api/sermons/" + updatedSermon.id).send(updatedSermon);

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty("error");
        });
    });

    describe("DELETE /:id", () => {
        beforeEach(async () => {
            token = new User().generateAuthToken();
        });

        it("should delete the sermon with the given ID", async () => {
            testSermon = {
                id: null,
                title: "Test Sermon 1000",
                scripture: "Test Scripture 1000",
                speaker: "Test Speaker 1000",
                date: Date.now().toString()
            };

            mp3FilePath = "./tests/mp3/test.mp3";

            const createResponse = await request(server)
                .post("/api/sermons/")
                .set("authorization", "Bearer " + token)
                .set('Content-Type', 'multipart/form-data')
                .field("title", testSermon.title)
                .field("scripture", testSermon.scripture)
                .field("speaker", testSermon.speaker)
                .field("date", testSermon.date)
                .attach("mp3", mp3FilePath);

            testSermon.id = createResponse.body.sermon._id;

            const res = await request(server).delete("/api/sermons/" + testSermon.id).set("authorization", "Bearer " + token).send();

            expect(res.status).toBe(200);
        });

        it("should return a 404 status if the given ID cannot be matched", async () => {
            id = mongoose.Types.ObjectId();

            const res = await request(server).delete("/api/sermons/" + id).set("authorization", "Bearer " + token).send();

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty("error");
        });

        it("should return a 500 error if the mp3 file cannot be located or removed", async () => {
            const res = await request(server).delete("/api/sermons/" + sermons[0]._id).set("authorization", "Bearer " + token).send();

            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty("error");
        });
    });
});