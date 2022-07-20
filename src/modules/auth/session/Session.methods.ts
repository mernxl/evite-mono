import { ISession } from './session.types';

export type SessionMethodsType = typeof SessionMethods;

export const SessionMethods = {
  closeSession(this: ISession): Promise<ISession> {
    this.closed = true;

    return this.save();
  },
};
