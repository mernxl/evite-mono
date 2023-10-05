import dbConnection from '../../config/mongoose';
import { modelNameToCollectionName } from '../../utils';
import { IEvent, IEventModel } from './event';
import { IEvite, IEviteModel } from './evite';

export enum EventModels {
  Event = 'Event',
  Evite = 'EventEvite',
}

export const EventCollections = {
  Event: modelNameToCollectionName(EventModels.Event, 's'),
  Evite: modelNameToCollectionName(EventModels.Evite, 's'),
};

export const EventServices = {
  Event: () => EventDBConnection.model<IEvent, IEventModel>(EventModels.Event),
  Evite: () => EventDBConnection.model<IEvite, IEviteModel>(EventModels.Evite),
};

export const EventDBConnection = dbConnection;
