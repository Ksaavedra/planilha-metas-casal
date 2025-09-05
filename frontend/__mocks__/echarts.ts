// Mock para echarts
export const echarts = {
  init: jest.fn(() => ({
    setOption: jest.fn(),
    resize: jest.fn(),
    dispose: jest.fn(),
  })),
  getInstanceByDom: jest.fn(),
  dispose: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
};

export default echarts;
