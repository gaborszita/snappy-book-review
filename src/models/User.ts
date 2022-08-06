import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

// If a user is in pending activation state, the document automatically expires
// and gets deleted after 24 hours (the verify email link expires in 24 hours).

export enum AccountState {
  PendingActivation,
  Active,
  PendingDeletion
}

export interface IUser extends Document {
  firstName: string,
  lastName: string,
  fullName: string,
  email: string,
  password: string,
  accountState: AccountState,
  emailVerificationHash: string,
  passwordResetLink: string,
  emailVerificationExpire: Date
}

const UserSchema = new Schema<IUser>({
  firstName: { type: String, requiured: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  accountState: {
    type: Number,
    enum: Object.values(AccountState).filter(val => typeof val === 'number'),
    required: true
  },
  emailVerificationHash: { type: String },
  passwordResetLink: { type: String, required: true },
  emailVerificationExpire: { type: Date, expires: '24h', default: new Date() }
});

// full name virtual
UserSchema.virtual("fullName").get(function() {
  return this.firstName + ' ' + this.lastName;
});

// hash password
UserSchema.pre('save', function(next) {
  const user = this as IUser;

  // only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) return next();

  // generate a salt
  bcrypt.genSalt(10, function(err, salt) {
    if (err) return next(err);

    // hash the password along with our new salt
    bcrypt.hash(user.password, salt, function(err, hash) {
        if (err) return next(err);

        // override the cleartext password with the hashed one
        user.password = hash;
        next();
    });
  });
});

UserSchema.methods.verifyPassword = function(password: string,
  cb: (err: Error, match: boolean) => void) {
  bcrypt.compare(password, this.password, function(err, match) {
    cb(err, match);
  })
}

export const User = mongoose.model<IUser>('user', UserSchema);