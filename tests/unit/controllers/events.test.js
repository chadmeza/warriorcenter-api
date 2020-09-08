const httpMocks = require("node-mocks-http");

const eventsController = require("../../../controllers/events");
const Event = require("../../../models/event");

let req, res, next;
let events;

describe("eventsController", () => {
    beforeEach(() => {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
        next = jest.fn();
    
        Event.find = jest.fn();
        Event.findById = jest.fn();
        Event.create = jest.fn();
        Event.findByIdAndUpdate = jest.fn();
        Event.deleteOne = jest.fn();
        Event.deleteMany = jest.fn();
    
        events = [
            {
                name: "Test Event 1",
                details: "This is a test event.",
                address: "123 Main Street",
                date: Date.now().toString(),
                time: "1:00 PM"
            },
            {
                name: "Test Event 2",
                details: "This is a test event.",
                address: "123 Main Street",
                date: Date.now().toString(),
                time: "2:00 PM"
            },
            {
                name: "Test Event 3",
                details: "This is a test event.",
                address: "123 Main Street",
                date: Date.now().toString(),
                time: "3:00 PM"
            },
        ];
    });
    
    afterEach(() => {
        events = [];
    });
    
    describe("getEvents", () => {
        it("should return all events", async () => {
            Event.find.mockReturnValue({
                sort: function() {
                    return events;
                }
            });
    
            await eventsController.getEvents(req, res, next);
            
            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toHaveProperty("events");
            expect(res._getJSONData()).toMatchObject({ "events": events });
        }); 
        
        it("should return a 500 error if a problem exists in the query", async () => {
            Event.find.mockRejectedValue(new Error("Test"));
    
            await eventsController.getEvents(req, res, next);
    
            expect(res.statusCode).toBe(500);
            expect(res._getJSONData()).toHaveProperty("error");
        });
    });
    
    describe("getLimitedEvents", () => {
        it("should include a limit in the query", async () => {
            req.params.number = 1;
            Event.find.mockReturnValue(events);
            
            await eventsController.getLimitedEvents(req, res, next);
            
            expect(res.statusCode).toBe(200);
            expect(Event.find.mock.calls[0][2]).toHaveProperty("limit", 1);
        });
    
        it("should default to a limit of 3 if the query parameter is NaN", async () => {
            req.params.number = "test";
            Event.find.mockReturnValue(events);
    
            await eventsController.getLimitedEvents(req, res, next);
    
            expect(res.statusCode).toBe(200);
            expect(Event.find.mock.calls[0][2]).toHaveProperty("limit", 3);
        });
    
        it("should return events", async () => {
            Event.find.mockReturnValue(events);
    
            await eventsController.getLimitedEvents(req, res, next);
    
            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toHaveProperty("events");
            expect(res._getJSONData().events).toMatchObject(events);
        });
    
        it("should return a 500 error is a problem exists in the query", async () => {
            Event.find.mockRejectedValue(new Error("Test"));
    
            await eventsController.getLimitedEvents(req, res, next);
    
            expect(res.statusCode).toBe(500);
            expect(res._getJSONData()).toHaveProperty("error");
        });
    });
    
    describe("getEvent", () => {
        it("should be called with the given ID", async () => {
            req.params.id = "123456";
            Event.findById.mockReturnValue(events[0]);
    
            await eventsController.getEvent(req, res, next);
    
            expect(res.statusCode).toBe(200);
            expect(Event.findById).toHaveBeenCalledWith("123456");
        });
    
        it("should return an event if one is found", async () => {
            Event.findById.mockReturnValue(events[0]);
    
            await eventsController.getEvent(req, res, next);
    
            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toHaveProperty("event");
            expect(res._getJSONData()).toMatchObject({ "event": events[0] })
        });
    
        it("should return a 404 error if an event is not found", async () => {
            Event.findById.mockReturnValue(null);
    
            await eventsController.getEvent(req, res, next);
    
            expect(res.statusCode).toBe(404);
            expect(res._getJSONData()).toHaveProperty("error");
        });
    
        it("should return a 500 error if a problem exists in the query", async () => {
            Event.findById.mockRejectedValue(new Error("Test"));
    
            await eventsController.getEvent(req, res, next);
    
            expect(res.statusCode).toBe(500);
            expect(res._getJSONData()).toHaveProperty("error");
        });
    });
    
    describe("createEvent", () => {
        it("should return new event on successful save", async () => {
            Event.create.mockReturnValue(events[0]);
    
            await eventsController.createEvent(req, res, next);
    
            expect(res.statusCode).toBe(201);
            expect(res._getJSONData()).toHaveProperty("event");
            expect(res._getJSONData().event).toMatchObject(events[0]);
        });
    
        it("should return a 500 error on failed save", async () => {
            Event.create.mockRejectedValue(new Error("Failed to save."));
    
            await eventsController.createEvent(req, res, next);
    
            expect(res.statusCode).toBe(500);
            expect(res._getJSONData()).toHaveProperty("error");
        });
    });
    
    describe("updateEvent", () => {
        it("should make a call to update an event with the given ID", async () => {
            req.params.id = 1;
            Event.findByIdAndUpdate.mockReturnValue(events[0]);
            
            await eventsController.updateEvent(req, res, next);
    
            expect(res.statusCode).toBe(200);
            expect(Event.findByIdAndUpdate.mock.calls[0][0]).toBe(1);
        });
    
        it("should return a 404 error if an event does not exist with the given ID", async () => {
            Event.findByIdAndUpdate.mockReturnValue(null);
    
            await eventsController.updateEvent(req, res, next);
    
            expect(res.statusCode).toBe(404);
        });
        
        it("should return a 500 error if there's a problem with the query", async () => {
            Event.findByIdAndUpdate.mockRejectedValue(new Error("Test"));
    
            await eventsController.updateEvent(req, res, next);
    
            expect(res.statusCode).toBe(500);
            expect(res._getJSONData()).toHaveProperty("error");
        });
    });
    
    describe("deleteEvent", () => {
        it("should make a call to delete an event with the given ID", async () => {
            req.params.id = 1;
            Event.deleteOne.mockReturnValue(null);
    
            await eventsController.deleteEvent(req, res, next);
    
            expect(res.statusCode).toBe(200);
            expect(Event.deleteOne).toHaveBeenCalledWith({ _id: 1 });
            expect(res._getJSONData()).toHaveProperty("result");
        });
    
        it("should return a 500 error if there's a problem with the query", async () => {
            Event.deleteOne.mockRejectedValue(new Error("Test"));
    
            await eventsController.deleteEvent(req, res, next);
    
            expect(res.statusCode).toBe(500);
            expect(res._getJSONData()).toHaveProperty("error");
        });
    });
    
    describe("deleteOldEvents", () => {
        it("should return a 200 status with the result of the delete operation", async () => {
            Event.deleteMany.mockReturnValue(null);
    
            await eventsController.deleteOldEvents(req, res, next);
    
            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toHaveProperty("result");
        });
    
        it("should return a 500 error if there's a problem with the query", async () => {
            Event.deleteMany.mockRejectedValue(new Error("Test"));
    
            await eventsController.deleteOldEvents(req, res, next);
    
            expect(res.statusCode).toBe(500);
            expect(res._getJSONData()).toHaveProperty("error");
        });
    });
});
