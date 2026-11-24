import SwiftUI
import WebKit

@main
struct AgentCApp: App {
    var body: some Scene {
        WindowGroup { CanvasScreen() }
    }
}

private struct CanvasScreen: View {
    @State private var problem: String?
    @State private var attempt = 0

    var body: some View {
        Group {
            if let url = Self.canvasURL {
                CanvasWebView(url: url, problem: $problem)
                    .id(attempt)
                    .overlay {
                        if let problem {
                            ContentUnavailableView {
                                Label("Canvas unavailable", systemImage: "wifi.exclamationmark")
                            } description: {
                                Text(problem)
                            } actions: {
                                Button("Try again") {
                                    self.problem = nil
                                    attempt += 1
                                }
                            }
                            .background(.background)
                        }
                    }
            } else {
                ContentUnavailableView("Set the workspace URL", systemImage: "link")
            }
        }
    }

    private static var canvasURL: URL? {
        if let value = Bundle.main.object(forInfoDictionaryKey: "AgentCWorkspaceURL") as? String,
           let url = URL(string: value),
           url.scheme == "https", url.host != nil, url.user == nil, url.password == nil {
            return url
        }
        #if DEBUG && targetEnvironment(simulator)
        return URL(string: "http://localhost:5173/")
        #else
        return nil
        #endif
    }
}

private struct CanvasWebView: UIViewRepresentable {
    let url: URL
    @Binding var problem: String?

    func makeCoordinator() -> Coordinator {
        Coordinator(url: url, problem: $problem)
    }

    func makeUIView(context: Context) -> WKWebView {
        let view = WKWebView()
        view.navigationDelegate = context.coordinator
        view.uiDelegate = context.coordinator
        view.scrollView.bounces = false
        #if DEBUG
        view.isInspectable = true
        #endif
        view.load(URLRequest(url: url))
        return view
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        let url: URL
        @Binding var problem: String?

        init(url: URL, problem: Binding<String?>) {
            self.url = url
            self._problem = problem
        }

        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction) async -> WKNavigationActionPolicy {
            guard let target = action.request.url else { return .cancel }
            if action.targetFrame?.isMainFrame == false { return .allow }
            if matchesOrigin(target) { return .allow }
            if action.navigationType == .linkActivated { openBrowser(target) }
            return .cancel
        }

        func webView(
            _ webView: WKWebView,
            createWebViewWith configuration: WKWebViewConfiguration,
            for action: WKNavigationAction,
            windowFeatures: WKWindowFeatures
        ) -> WKWebView? {
            guard let target = action.request.url else { return nil }
            if matchesOrigin(target) { webView.load(action.request) }
            else { openBrowser(target) }
            return nil
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            if (error as NSError).code != NSURLErrorCancelled {
                problem = "Check your connection and open the workspace again."
            }
        }

        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
            problem = "The editor stopped responding. Open the workspace again to see the last saved board."
        }

        private func matchesOrigin(_ target: URL) -> Bool {
            target.scheme == url.scheme && target.host == url.host && target.port == url.port
        }

        private func openBrowser(_ target: URL) {
            guard target.scheme == "https" || target.scheme == "http" else { return }
            UIApplication.shared.open(target)
        }
    }
}
