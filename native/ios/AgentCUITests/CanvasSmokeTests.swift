import XCTest

final class CanvasSmokeTests: XCTestCase {
    @MainActor
    func testCreateBoardAndReopenWithSource() {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launch()
        let web = app.webViews.firstMatch
        let title = "Studio Smoke \(UUID().uuidString.prefix(6))"
        let projectName = web.textFields["Project name"]
        XCTAssertTrue(projectName.waitForExistence(timeout: 20))
        projectName.tap()
        projectName.typeText(title + "\n")

        let add = web.buttons["Show Project tools"]
        XCTAssertTrue(add.waitForExistence(timeout: 20))
        add.tap()

        let sourceName = web.textFields["Source name"]
        XCTAssertTrue(sourceName.waitForExistence(timeout: 20), "Create project should open the canvas")
        sourceName.tap()
        sourceName.typeText("Editorial reference")
        let sourceURL = web.textFields["Source URL"]
        sourceURL.tap()
        sourceURL.typeText("https://example.com/reference\n")

        let nodeMap = web.descendants(matching: .any)["Node map"].firstMatch
        XCTAssertTrue(nodeMap.waitForExistence(timeout: 10))
        nodeMap.tap()
        let showLayers = web.buttons["Show Layers"]
        let sourceLayer = web.descendants(matching: .any)["Locate Editorial reference"].firstMatch
        showLayers.tap()
        XCTAssertTrue(sourceLayer.waitForExistence(timeout: 15), "The pinned source should appear in Layers")
        XCTAssertTrue(web.staticTexts["Saved on this browser"].waitForExistence(timeout: 10))

        app.terminate()
        app.launch()
        let openProject = web.buttons["Open \(title)"]
        XCTAssertTrue(openProject.waitForExistence(timeout: 15), "The project should survive app relaunch")
        openProject.tap()
        XCTAssertTrue(showLayers.waitForExistence(timeout: 15))
        showLayers.tap()
        XCTAssertTrue(sourceLayer.waitForExistence(timeout: 15), "The source should survive app relaunch")
    }
}
