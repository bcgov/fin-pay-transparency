import { app } from './app';
const request = require('supertest');

//jest.mock('passport')
//jest.mock('./v1/services/auth-service')

afterEach(() => {
  jest.clearAllMocks();
});

describe("GET /employee-count-range", () => {
  it("returns an array of code values", async () => {
    //passport.authenticate = jest.fn().mockImplementation((req, res, next) => next())
    //auth.isValidBackendToken = jest.fn().mockImplementation((req, res, next) => next())

    const res = await request(app)
      .get("/v1/codes/employee-count-range")
      .set('Authorization', 'Bearer ' + "fake token")
    //.set('Accept', 'application/json')      
    console.log(res.body)
    expect(res.statusCode).toBe(200);
    expect(res.headers["Content-Type"]).toMatch(/json/);
    //expect(res.body.length).toBe(3);

  })
})