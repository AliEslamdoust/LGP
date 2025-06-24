// Copyright (c) 2025 Ali Eslamdoust
// MIT License

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckAuth } from "../lib/utils";
import Loading from "./loading";

/**
 * WithAuth Higher-Order Component (HOC)
 * ------------------------------------
 * A higher-order component that wraps other components to provide authentication.
 */
const WithAuth = (Component) => {
  return (props) => {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const checkAuthentication = async () => {
        setLoading(true);
        const authResult = await CheckAuth();
        setIsAuthenticated(authResult.success);
        setLoading(false);
      };

      checkAuthentication();
    }, []);

    if (loading) {
      return Loading;
    }

    if (!isAuthenticated) {
      router.push("/login");
      return null;
    }

    return <Component {...props} />;
  };
};

export default WithAuth;
