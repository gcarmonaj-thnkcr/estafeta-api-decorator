export interface Ilogger {
  info: (data: any) => void
  error: (data: any) => void
  child: (options: { requestId: string }) => ChildLogger
}

class cLogger implements Ilogger{
  constructor(){}
  
  info(data: any){
    console.log(data)
  }

  error(data: any) {
    console.error(data);
  }
  
  child(options: { requestId: string }): ChildLogger {
    return new ChildLogger(this, options.requestId);
  }
}

class ChildLogger implements Ilogger {
  private parent: cLogger
  private requestId: string 

  constructor(parent: cLogger, requestId: string){
    this.parent = parent
    this.requestId = requestId
  }
  
  info(data: any) {
    this.parent.info(`[${this.requestId}]: ${data}`);
  }

  error(data: any) {
    this.parent.error(`[${this.requestId}]: ${data}`);
  }

  // Método para crear un child logger anidado
  child(options: { requestId: string }): ChildLogger {
    return new ChildLogger(this.parent, `${this.requestId}:${options.requestId}`);
  }
}

export const logger = new cLogger()
