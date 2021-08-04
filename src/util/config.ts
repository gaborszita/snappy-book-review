import { Config, IConfig } from '../models/Config';

async function config(): Promise<IConfig> {
  return Config.findOne().exec();
}

export {config};