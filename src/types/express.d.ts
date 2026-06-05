import { JwtPayload } from "jsonwebtoken";

interface CustomJwtPayload extends JwtPayload {
  id: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: CustomJwtPayload;
    }
  }
}

export { CustomJwtPayload };
