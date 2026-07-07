import { LoaderIcon, LogOutIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { Button } from "../shadcnui/button";

const LogoutButton = () => {
  const [loading, setLoading] = useState(false);

  const logoutHandler = async () => {
    setLoading(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logout successful");
      window.location.assign("/auth");
    } catch {
      toast.error("Something went wrong");
    }

    setLoading(false);
  };

  return (
    <Button
      type="button"
      variant="destructive"
      onClick={logoutHandler}
      disabled={loading}>
      {loading ?
        <>
          <LoaderIcon className="animate-spin" /> Logging out...
        </>
      : <>
          <LogOutIcon /> Logout
        </>
      }
    </Button>
  );
};

export default LogoutButton;
