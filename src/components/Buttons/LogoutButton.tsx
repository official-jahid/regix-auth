import { authClient } from "@/lib/auth-client";
import { LoaderIcon, LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { Button } from "../shadcnui/button";

const LogoutButton = () => {
  const [loading, setLoading] = useState(false);

  const { replace } = useRouter();

  const logoutHandler = async () => {
    setLoading(true);

    try {
      await authClient.signOut();

      toast.success("Logout successful");

      replace("/auth");
    } catch (error) {
      console.log(error);

      toast.error("Something went wrong");
    }

    await new Promise((r) => setTimeout(r, 1000));

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
