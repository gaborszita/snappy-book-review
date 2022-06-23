import mongoose, { Schema } from 'mongoose';

export interface IConfig extends Document {
  sitePreferredProtocol: string,
  siteAddress: string,
  siteUrl: string,
  sessionSecret: string,
  sessionMaxAge: number,
  sessionCookie: string,
  loggedInCookie: string,
  smtpConnectionUrl: string,
  emailFrom: string
}

const ConfigSchema = new Schema<IConfig>({
  sitePreferredProtocol: { type: String, requiured: true },
  siteAddress: { type: String, required: true },
  sessionSecret: { type: String, required: true },
  sessionMaxAge: { type: Number, required: true },
  smtpConnectionUrl: { type: String, required: true },
  emailFrom: { type: String, required: true }
}, {
  capped: { size: 1024, max: 1 }
});

ConfigSchema.virtual('siteUrl').get(function() {
  return this.sitePreferredProtocol + '://' + this.siteAddress
});

ConfigSchema.virtual('sessionCookie').get(function() {
  return 'session_id';
})

ConfigSchema.virtual('loggedInCookie').get(function() {
  return 'logged_in';
});

export const Config = mongoose.model<IConfig>('config', ConfigSchema);