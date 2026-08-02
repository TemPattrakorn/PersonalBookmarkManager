import { Navigate, Route, Routes } from "react-router";
import { CallbackPage } from "../features/auth/pages/CallbackPage";
import { BookmarksListPage } from "../features/bookmarks/pages/BookmarksListPage";
import { CollectionsListPage } from "../features/collections/pages/CollectionsListPage";
import { ProtectedRoute } from "./ProtectedRoute";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Navigate replace to="/collections" />} path="/" />
      <Route element={<CallbackPage />} path="/callback" />
      <Route
        element={
          <ProtectedRoute>
            <CollectionsListPage />
          </ProtectedRoute>
        }
        path="/collections"
      />
      <Route
        element={
          <ProtectedRoute>
            <BookmarksListPage />
          </ProtectedRoute>
        }
        path="/bookmarks"
      />
      <Route element={<Navigate replace to="/collections" />} path="*" />
    </Routes>
  );
}
