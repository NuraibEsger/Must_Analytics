import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: null,
  email: null,
};

export const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    loginAction: (state, action) => {
      const { token, email } = action.payload;
      state.token = token;
      state.email = email;
    },
    logoutAction: () => {
      return initialState;
    },
  },
});

export const { loginAction, logoutAction } = accountSlice.actions;

export default accountSlice.reducer;