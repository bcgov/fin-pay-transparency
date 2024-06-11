import dotenv from 'dotenv';

const globalSetup = (config) => {
  dotenv.config({
    path: '.env.playwright',
    override: true,
  });
};

export default globalSetup;
