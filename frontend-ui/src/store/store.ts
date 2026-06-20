import { configureStore, createSlice } from "@reduxjs/toolkit";

const projectSlice = createSlice({
  name: "project",
  initialState: {
    projects: [],
    workflows: {}
  },
  reducers: {
    setProjects: (state, action) => {
      state.projects = action.payload;
    },
    setWorkflows: (state, action) => {
      state.workflows = action.payload;
    }
  }
});

export const { setProjects, setWorkflows } = projectSlice.actions;

export const store = configureStore({
  reducer: {
    project: projectSlice.reducer
  }
});