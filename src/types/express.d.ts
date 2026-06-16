import { JwtPayload } from "jsonwebtoken";

interface CustomJwtPayload extends JwtPayload {
  id: string;
  name: string;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: CustomJwtPayload;
    }
  }
}

export { CustomJwtPayload };
