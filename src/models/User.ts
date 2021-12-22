import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export enum AccountState {
  PendingActivation,
  Active,
  PendingDeletion
}

export interface IUser extends Document {
  firstname: string,
  lastname: string,
  email: string,
  password: string,
  accountState: AccountState,
  email_verification_link: string,
  password_reset_link: string
}

const UserSchema = new Schema<IUser>({
  firstname: { type: String, requiured: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  accountState: { 
    type: Number,
    enum: Object.values(AccountState),
    required: true
  },
  email_verification_link: { type: String, required: true },
  password_reset_link: { type: String, required: true }
});

// hash password
UserSchema.pre('save', function(next) {
  // only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  // generate a salt
  bcrypt.genSalt(10, function(err, salt) {
    if (err) return next(err);

    // hash the password along with our new salt
    bcrypt.hash(this.password, salt, function(err, hash) {
        if (err) return next(err);

        // override the cleartext password with the hashed one
        this.password = hash;
        next();
    });
  });
})

export const User = mongoose.model<IUser>('user', UserSchema);