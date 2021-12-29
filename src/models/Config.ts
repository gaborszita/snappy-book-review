import mongoose, { Schema } from 'mongoose';

export interface IConfig extends Document {
  sitePreferredProtocol: string,
  siteAddress: string,
  siteUrl: string,
  sessionSecret: string
}

const ConfigSchema = new Schema<IConfig>({
  sitePreferredProtocol: { type: String, requiured: true },
  siteAddress: { type: String, required: true },
  sessionSecret: { type: String, required: true }
}, {
  capped: { size: 1024, max: 1 }
});

ConfigSchema.virtual('siteUrl').get(function() {
  return this.sitePreferredProtocol + '://' + this.siteAddress
});

export const Config = mongoose.model<IConfig>('config', ConfigSchema);