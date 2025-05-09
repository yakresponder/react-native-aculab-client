require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-aculab-client"
  s.version      = package["version"]
  s.summary      = package["description"] || "React Native Aculab Client"
  s.homepage     = "https://github.com/yakresponder/react-native-aculab-client"
  s.license      = package["license"] || "MIT"
  s.authors      = package["author"] || "Yak Responder"

  s.platforms    = { :ios => "15.1" }

  s.source = { :git => "https://github.com/yakresponder/react-native-aculab-client.git", :tag => "main" }

  s.source_files = "ios/**/*.{h,m,mm}"
  s.requires_arc = true

  s.dependency "React-Core"
  s.dependency "react-native-webrtc"
end
