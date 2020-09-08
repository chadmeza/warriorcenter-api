const request = require("supertest");
const mongoose = require("mongoose");

const Event = require("../../../models/event");
const User = require("../../../models/user");

let server;
let events;
let id;
let token;

describe("/api/events", () => {
    beforeEach(async () => {
        server = require("../../../server");

        events = [
            new Event({
                name: "Test Event 1",
                details: "This is a test event.",
                address: "123 Main Street",
                date: Date.now().toString(),
                time: "1:00 PM"
            }),
            new Event({
                name: "Test Event 2",
                details: "This is a test event.",
                address: "123 Main Street",
                date: Date.now().toString(),
                time: "2:00 PM"
            }),
            new Event({
                name: "Test Event 3",
                details: "This is a test event.",
                address: "123 Main Street",
                date: Date.now().toString(),
                time: "3:00 PM"
            }),
        ];

        await Event.insertMany(events);
    });

    afterEach(async () => {
        await server.close();
        await Event.remove({});
    });

    describe("GET /", () => {
        it("should return all events", async () => {
            const res = await request(server).get("/api/events");

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("events");
            expect(res.body.events.some(event => { return event.name === "Test Event 1" })).toBeTruthy();
            expect(res.body.events.length).toBe(events.length);
        });
    });

    describe("GET /:id", () => {
        it("should return an event when given a valid ID", async () => {
            const res = await request(server).get("/api/events/" + events[0]._id);
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("event");
            expect(res.body.event).toHaveProperty("name", events[0].name);
        });

        it("should return a 404 status when no events match the given ID", async () => {
            id = mongoose.Types.ObjectId();
            const res = await request(server).get("/api/events/" + id);

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty("error");
        });

        it("should return a 500 error when given an invalid ID", async () => {
            const res = await request(server).get("/api/events/1");

            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty("error");
        });
    });

    describe("GET /limit/:number", () => {
        beforeEach(async () => {
            for (const event of events) {
                event.date = Date.now() + (10 * 60 * 60 * 1000);
                await Event.findByIdAndUpdate(event._id, { date: event.date }, { new: true });
            }
        });

        it("should return the specified number of events when given a valid number", async () => {
            const res = await request(server).get("/api/events/limit/1");

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("events");
            expect(res.body.events.length).toBe(1);
        });

        it("should return a default value of 3 events when given an invalid number", async () => {
            const res = await request(server).get("/api/events/limit/test");

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("events");
            expect(res.body.events.length).toBe(3);
        });
    });

    describe("POST /", () => {
        it("should return a 201 status with the newly created event", async () => {
            const newEvent = {
                name: "Test Event",
                details: "This is a test event.",
                address: "123 Main Street",
                date: Date.now(),
                time: "1:00 PM"
            };
            token = new User().generateAuthToken();

            const res = await request(server).post("/api/events/").set("authorization", "Bearer " + token).send(newEvent);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty("event");
            expect(res.body).toHaveProperty("id");
            expect(res.body.event).toHaveProperty("name", newEvent.name);
        });
    });

    describe("PUT /:id", () => {
        beforeEach(() => {
            token = new User().generateAuthToken();
            events[0].name = "Test Event 1000000";
            id = mongoose.Types.ObjectId();
        });

        it("should update the event if the input is valid", async () => {
            const res = await request(server)
                                .put("/api/events/" + events[0]._id)
                                .set("authorization", "Bearer " + token)
                                .send({
                                    id: events[0]._id,
                                    name: events[0].name,
                                    details: events[0].details,
                                    address: events[0].address,
                                    date: events[0].date,
                                    time: events[0].time
                                });
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("event");
            expect(res.body.event).toHaveProperty("name", events[0].name);
        });

        it("should return a status of 401 if the user is not logged in", async () => {
            const res = await request(server)
                                .put("/api/events/" + id)
                                .send({
                                    id: events[0]._id,
                                    name: events[0].name,
                                    details: events[0].details,
                                    address: events[0].address,
                                    date: events[0].date,
                                    time: events[0].time
                                });

            expect(res.status).toBe(401);
        });

        it("should return a status of 500 if the ID is not a valid format", async () => {
            id = 1;
            
            const res = await request(server)
                                .put("/api/events/" + id)
                                .set("authorization", "Bearer " + token)
                                .send({
                                    id: id,
                                    name: events[0].name,
                                    details: events[0].details,
                                    address: events[0].address,
                                    date: events[0].date,
                                    time: events[0].time
                                });
            
            expect(res.status).toBe(500);
        });

        it("should return a status of 404 if an event with the given ID does not exist", async () => {
            const res = await request(server)
                                .put("/api/events/" + id)
                                .set("authorization", "Bearer " + token)
                                .send({
                                    id: id,
                                    name: events[0].name,
                                    details: events[0].details,
                                    address: events[0].address,
                                    date: events[0].date,
                                    time: events[0].time
                                });
            
            expect(res.status).toBe(404);
        });
    });

    describe("DELETE /:id", () => {
        it("should return a 200 status with the result of the delete operation", async () => {
            token = new User().generateAuthToken();

            const res = await request(server).delete("/api/events/" + events[0]._id).set("authorization", "Bearer " + token);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("result");
            expect(res.body.result.deletedCount).toBe(1);
        });
    });

    describe("DELETE /delete/old", () => {
        it("should delete all events that have a date older than today", async () => {
            token = new User().generateAuthToken();

            const res = await request(server).delete("/api/events/delete/old").set("authorization", "Bearer " + token);
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("result");
            expect(res.body.result.deletedCount).toBe(events.length);
        });

        it ("should return a status of 401 if the user is not logged in", async () => {
            const res = await request(server).delete("/api/events/delete/old");

            expect(res.status).toBe(401);
        });
    });
});