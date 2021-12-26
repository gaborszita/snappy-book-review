import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export enum AccountState {
  PendingActivation,
  Active,
  PendingDeletion
}

export interface IUser extends Document {
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  accountState: AccountState,
  emailVerificationLink: string,
  passwordResetLink: string
}

const UserSchema = new Schema<IUser>({
  firstName: { type: String, requiured: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  accountState: { 
    type: Number,
    enum: Object.values(AccountState),
    required: true
  },
  emailVerificationLink: { type: String, required: true },
  passwordResetLink: { type: String, required: true }
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
})

export const User = mongoose.model<IUser>('user', UserSchema);