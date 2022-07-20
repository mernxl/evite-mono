import { AuthCollections, AuthDBConnection, AuthModels } from '../auth.config';
import { SessionMethods } from './Session.methods';
import { SessionSchema } from './session.schema';
import { SessionStatics } from './session.statics';
import { ISession, ISessionModel } from './session.types';

SessionSchema.methods = SessionMethods;
SessionSchema.statics = SessionStatics;

export const SessionModel: ISessionModel = AuthDBConnection.model<ISession, ISessionModel>(
  AuthModels.Session,
  SessionSchema,
  AuthCollections.Session,
);
