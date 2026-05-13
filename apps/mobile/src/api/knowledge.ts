import api from "./axios";

export const getMemories = () => api.get("/memories").then((res) => res.data.memories);
export const updateMemory = (id: string, data: Record<string, unknown>) => api.put(`/memories/${id}`, data).then((res) => res.data.memory);
export const deleteMemory = (id: string) => api.delete(`/memories/${id}`).then((res) => res.data);

export const getEntities = () => api.get("/entities").then((res) => res.data.entities);
export const updateEntity = (id: string, data: Record<string, unknown>) => api.put(`/entities/${id}`, data).then((res) => res.data.entity);
export const deleteEntity = (id: string) => api.delete(`/entities/${id}`).then((res) => res.data);

export const getRelationships = () => api.get("/relationships").then((res) => res.data.relationships);
export const updateRelationship = (id: string, data: Record<string, unknown>) => api.put(`/relationships/${id}`, data).then((res) => res.data.relationship);
export const deleteRelationship = (id: string) => api.delete(`/relationships/${id}`).then((res) => res.data);

export const getActions = () => api.get("/actions").then((res) => res.data.actions);
export const updateAction = (id: string, data: Record<string, unknown>) => api.put(`/actions/${id}`, data).then((res) => res.data.action);
export const deleteAction = (id: string) => api.delete(`/actions/${id}`).then((res) => res.data);
