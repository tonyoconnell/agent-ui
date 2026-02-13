class Unit {
  constructor(envelope) {
    const { receiver: targetid } = envelope;
    this.id = targetid;
    this.services = {};  // named services (logic + unified interface + promise)
    this.roles = {};     // context-dependent service execution
  }

  // Single public entrypoint
  receive(envelope) {
    const { receive: target, payload } = envelope;

    if (this.services[target]) {
      return this.executeService(target, payload);
    }

    if (this.roles[target]) {
      return this.invokeRole(target, payload);
    }

    throw new Error(`Unknown target: ${target}`);
  }

  // Assign service (wraps logic with unified interface)
  assignService(name, fn) {
    this.services[name] = (payload) => {
      return new Promise((resolve, reject) => {
        try {
          const result = fn(payload);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    };
  }

  // Execute service - returns verifiable promise
  executeService(name, payload) {
    return this.services[name](payload);
  }

  // Assign role (context for service execution)
  assignRole(name, serviceName, context) {
    this.roles[name] = { service: serviceName, context };
  }

  // Invoke role - execute service with context
  invokeRole(name, payload) {
    const { service, context } = this.roles[name];
    return this.executeService(service, { ...payload, ...context });
  }
}

export { Unit };
