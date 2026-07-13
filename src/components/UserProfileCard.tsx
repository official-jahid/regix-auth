import { Avatar, AvatarFallback, AvatarImage } from "./shadcnui/avatar";
import { Card, CardContent, CardHeader } from "./shadcnui/card";

const UserProfileCard = () => {
  return (
    <Card className="w-sm rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl backdrop-saturate-150 dark:bg-black/20">
      <CardHeader className="flex flex-col items-center space-y-4 pt-8">
        <Avatar className="col-span-1 size-24">
          <AvatarImage
            src="https://github.com/jahid-ekbal.png"
            alt="Profile Picture"
          />
          <AvatarFallback className="bg-white/20 font-bold text-white">
            JE
          </AvatarFallback>
        </Avatar>
      </CardHeader>

      <CardContent className="items-center justify-items-center">
        <div className="font-medium">Jahid Ekbal Mallick</div>
        <div className="text-sm">jahid.developer@example.com</div>
      </CardContent>
    </Card>
  );
};

export default UserProfileCard;
