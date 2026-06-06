const SAMPLE_DATA = {
  cm: `104.18.2.2:443#CM优选_示例
104.19.3.3:443#CM优选_示例
172.67.10.10:443#CM优选_示例`,
  tc: `198.41.220.10:443#天城优选_示例
198.41.221.10:8443#天城优选_示例
162.159.44.10:2053#天城优选_示例`,
  crow: `188.114.96.1:443#乌鸦优选_示例
188.114.97.1:443#乌鸦优选_示例
188.114.98.1:8443#乌鸦优选_示例`,
  mobile: `162.159.140.10:443#移动优选_示例
162.159.141.10:8443#移动优选_示例
104.16.20.20:2053#移动优选_示例`,
  global: `104.21.1.1:443#US_示例
172.67.1.1:443#JP_示例
188.114.96.1:443#HK_示例
188.114.97.1:443#SG_示例`,
  edgetunnel: `vless://00000000-0000-4000-8000-000000000001@104.21.1.1:443?encryption=none&security=tls&sni=example.pages.dev&type=ws&host=example.pages.dev&path=%2F#US-Edgetunnel-示例
vless://00000000-0000-4000-8000-000000000001@172.67.1.1:443?encryption=none&security=tls&sni=example.pages.dev&type=ws&host=example.pages.dev&path=%2F#JP-Edgetunnel-示例`,
  domains: `cloudflare.com:443#官方域名_示例
speed.cloudflare.com:443#测速域名_示例
www.visa.com:443#优选域名_示例`,
  proxyip: `proxyip.example.com:443#ProxyIP_示例
203.0.113.10:443#ProxyIP_示例`
};

const GLOBAL_POOL = [
  { ip: "104.21.1.1", port: 443, cc: "US", name: "美国" },
  { ip: "172.67.1.1", port: 443, cc: "US", name: "美国" },
  { ip: "188.114.96.1", port: 443, cc: "JP", name: "日本" },
  { ip: "188.114.97.1", port: 443, cc: "HK", name: "香港" },
  { ip: "162.159.140.10", port: 443, cc: "SG", name: "新加坡" },
  { ip: "162.159.141.10", port: 8443, cc: "KR", name: "韩国" },
  { ip: "104.18.2.2", port: 443, cc: "DE", name: "德国" },
  { ip: "104.19.3.3", port: 443, cc: "GB", name: "英国" },
  { ip: "104.16.20.20", port: 2053, cc: "FR", name: "法国" },
  { ip: "104.17.21.21", port: 443, cc: "NL", name: "荷兰" },
  { ip: "198.41.220.10", port: 443, cc: "CA", name: "加拿大" },
  { ip: "198.41.221.10", port: 8443, cc: "AU", name: "澳大利亚" },
  { ip: "162.159.44.10", port: 2053, cc: "TW", name: "台湾" },
  { ip: "162.159.45.10", port: 443, cc: "TH", name: "泰国" },
  { ip: "104.20.10.10", port: 443, cc: "IN", name: "印度" },
  { ip: "104.20.11.11", port: 443, cc: "BR", name: "巴西" }
];

export { SAMPLE_DATA, GLOBAL_POOL };
