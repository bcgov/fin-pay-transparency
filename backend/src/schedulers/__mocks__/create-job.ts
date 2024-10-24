/** This mock returns a fake CronJob class. Running start() will immediate
 *  execute the callback instead of waiting for specified time */
const mockCreateJob = jest.fn(
  (cronTime, callback, mutex, { title, message }) => {
    return {
      start: jest.fn(async () => {
        console.log(`Mock run`);
        try {
          await callback(); // Simulate the callback execution
        } catch (e) {
          console.error(`Mock error`);
        } finally {
          console.log(`Mock end run`);
        }
      }),
    };
  },
);

export { mockCreateJob as createJob };
