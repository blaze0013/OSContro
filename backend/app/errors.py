from fastapi import HTTPException

class APIError(HTTPException):
    def __init__(self, status_code: int, code: str, message: str, detail: str = None):
        self.status_code = status_code
        self.code = code
        self.message = message
        self.detail = detail
        d = {"code": code, "message": message}
        if detail:
            d["detail"] = detail
        super().__init__(status_code=status_code, detail=d)
