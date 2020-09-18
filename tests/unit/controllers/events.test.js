const httpMocks = require("node-mocks-http");

const eventsController = require("../../../controllers/events");
const Event = require("../../../models/event");

let req, res, next;
let events;
let testError;

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

        testError = new Error("Test");
    
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
        
        it("should forward errors to the error handler", async () => {
            Event.find.mockRejectedValue(testError);
    
            await eventsController.getEvents(req, res, next);
    
            expect(next).toHaveBeenCalled();
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
    
        it("should forward errors to the error handler", async () => {
            Event.find.mockRejectedValue(testError);
    
            await eventsController.getLimitedEvents(req, res, next);
    
            expect(next).toHaveBeenCalledWith(testError);
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
    
        it("should forward errors to the error handler", async () => {
            Event.findById.mockRejectedValue(testError);
    
            await eventsController.getEvent(req, res, next);
    
            expect(next).toHaveBeenCalledWith(testError);
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
    
        it("should forward errors to the error handler", async () => {
            Event.create.mockRejectedValue(testError);
    
            await eventsController.createEvent(req, res, next);
    
            expect(next).toHaveBeenCalledWith(testError);
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
        
        it("should forward errors to the error handler", async () => {
            Event.findByIdAndUpdate.mockRejectedValue(testError);
    
            await eventsController.updateEvent(req, res, next);
    
            expect(next).toHaveBeenCalledWith(testError);
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
    
        it("should forward errors to the error handler", async () => {
            Event.deleteOne.mockRejectedValue(testError);
    
            await eventsController.deleteEvent(req, res, next);
    
            expect(next).toHaveBeenCalledWith(testError);
        });
    });
    
    describe("deleteOldEvents", () => {
        it("should return a 200 status with the result of the delete operation", async () => {
            Event.deleteMany.mockReturnValue(null);
    
            await eventsController.deleteOldEvents(req, res, next);
    
            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toHaveProperty("result");
        });
    
        it("should forward errors to the error handler", async () => {
            Event.deleteMany.mockRejectedValue(testError);
    
            await eventsController.deleteOldEvents(req, res, next);
    
            expect(next).toHaveBeenCalledWith(testError);
        });
    });
});
