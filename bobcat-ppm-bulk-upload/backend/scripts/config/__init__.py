from pydantic import Field, BaseSettings

PROJECT_NAME = "candle"


class _Service(BaseSettings):
    MODULE_NAME: str = Field(default="workflow-management-v2")
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=9192, env="API_PORT")
    BUILD_DIR: str = Field(default="scripts/templates")
    PLUGIN_NAME: str = Field(default="candle")
    PROXY: str = Field(default="/hack-repl")
    BACKEND_DIR: str = Field(default=".")


class _PathToDir(BaseSettings):
    ASSETS: str = Field(default=f"{_Service().BUILD_DIR}/assets")


Service = _Service()
PathToDir = _PathToDir()
