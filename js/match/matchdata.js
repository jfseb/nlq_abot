"use strict";
/**
 * @file
 * @module jfseb.fdevstart.matchdata
 * @copyright (c) 2016 Gerd Forstmann
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.oWikis = exports.oUnitTests = void 0;
exports.oUnitTests = [
    {
        key: 'ClientSideTargetResolution',
        context: {
            systemObjectId: 'ClientSideTargetResolution',
            path: 'sap/bc/ui5_ui5/ui2/ushell/test-resources/sap/ushell/qunit/adapters/cdm/ClientSideTargetResolutionAdapter.qunit.html'
        }
    },
    {
        key: 'CommonDataModelAdapter',
        context: {
            systemObjectId: 'CommonDataModelAdapter',
            path: 'sap/bc/ui5_ui5/ui2/ushell/test-resources/sap/ushell/qunit/adapters/cdm/CommonDataModelAdapter.qunit.html'
        }
    },
    {
        key: 'ushell lib',
        context: {
            systemObjectId: 'ushell lib',
            path: 'sap/bc/ui5_ui5/ui2/ushell/test-resources/sap/ushell/qunit/testsuite.qunit.html'
        }
    },
    {
        key: 'ushell_abap',
        context: {
            systemObjectId: 'ushell_abap',
            path: 'sap/bc/ui5_ui5/ui2/ushell/test-resources/sap/ushell_abap/testsuite.qunit.html'
        }
    },
    {
        key: 'ui2 shell api',
        context: {
            systemObjectId: 'ui2 shell api',
            path: 'sap/public/bc/ui2/services/test/testsuite.qunit.html'
        }
    },
    {
        key: 'Shell.controller.js',
        context: {
            systemObjectId: 'Shell.controller.js',
            path: '/sap/bc/test/Shell.controller.js'
        }
    }
].concat([
    // alphabetic order please
    'test-resources/sap/ushell/qunit/adapters/cdm/ClientSideTargetResolutionAdapter.qunit.html',
    'test-resources/sap/ushell/qunit/adapters/cdm/CommonDataModelAdapter.qunit.html',
    'test-resources/sap/ushell/qunit/adapters/cdm/LaunchPageAdapter.qunit.html',
    'test-resources/sap/ushell/qunit/adapters/local/AppStateAdapter.qunit.html',
    'test-resources/sap/ushell/qunit/adapters/local/ClientSideTargetResolutionAdapter.qunit.html',
    'test-resources/sap/ushell/qunit/adapters/local/ContainerAdapter.qunit.html',
    'test-resources/sap/ushell/qunit/adapters/local/EndUserFeedbackAdapter.qunit.html',
    'test-resources/sap/ushell/qunit/adapters/local/NavTargetResolutionAdapter.qunit.html',
    'test-resources/sap/ushell/qunit/adapters/local/PersonalizationAdapter.qunit.html',
    'test-resources/sap/ushell/qunit/adapters/local/SupportTicketAdapterTest.qunit.html',
    'test-resources/sap/ushell/qunit/adapters/local/UserDefaultParameterPersistenceAdapter.qunit.html',
    'test-resources/sap/ushell/qunit/adapters/local/UserInfoAdapter.qunit.html',
    'test-resources/sap/ushell/qunit/bootstrap/sandbox.qunit.html',
    'test-resources/sap/ushell/qunit/CanvasShapesManager.qunit.html',
    'test-resources/sap/ushell/qunit/components/container/ApplicationContainer.qunit.html',
    'test-resources/sap/ushell/qunit/components/factsheet/annotation/ODataURLTemplating.qunit.html',
    'test-resources/sap/ushell/qunit/components/flp/ComponentKeysHandler.qunit.html',
    'test-resources/sap/ushell/qunit/components/flp/FlpApp.qunit.html',
    'test-resources/sap/ushell/qunit/components/flp/launchpad/appfinder/EasyAccess.qunit.html',
    'test-resources/sap/ushell/qunit/components/flp/launchpad/DashboardManager.qunit.html',
    'test-resources/sap/ushell/qunit/components/flp/launchpad/PagingManager.qunit.html',
    'test-resources/sap/ushell/qunit/components/flp/launchpad/appfinder/AppFinder.qunit.html',
    'test-resources/sap/ushell/qunit/components/flp/launchpad/appfinder/GroupListPopover.qunit.html',
    'test-resources/sap/ushell/qunit/components/flp/launchpad/appfinder/HierarchyApps.qunit.html',
    'test-resources/sap/ushell/qunit/components/flp/launchpad/appfinder/HierarchyFolders.qunit.html',
    'test-resources/sap/ushell/qunit/renderers/fiori2/userPreferences/LanguageRegionSelector.qunit.html',
    'test-resources/sap/ushell/qunit/components/flp/launchpad/dashboard/DashboardContent.qunit.html',
    'test-resources/sap/ushell/qunit/components/flp/launchpad/dashboard/DashboardUIActions.qunit.html',
    'test-resources/sap/ushell/qunit/components/flp/settings/FlpSettings.qunit.html',
    'test-resources/sap/ushell/qunit/components/tiles/applauncher/StaticTile.qunit.html',
    'test-resources/sap/ushell/qunit/components/tiles/applauncherdynamic/DynamicTile.qunit.html',
    'test-resources/sap/ushell/qunit/components/tiles/cdm/applauncher/StaticTile.qunit.html',
    'test-resources/sap/ushell/qunit/components/tiles/cdm/applauncherdynamic/DynamicTile.qunit.html',
    'test-resources/sap/ushell/qunit/components/tiles/utils.qunit.html',
    'test-resources/sap/ushell/qunit/components/tiles/utilsRT.qunit.html',
    'test-resources/sap/ushell/qunit/components/userActivity/userActivityLog.qunit.html',
    // "test-resources/sap/ushell/qunit/demoapps/UserDefaultPluginSample/UserDefaultPluginSample.qunit.html", // Currently not run inside the QUnit Test Loader for ushell-lib
    'test-resources/sap/ushell/qunit/FLPAnalytics.qunit.html',
    'test-resources/sap/ushell/qunit/Layout.qunit.html',
    'test-resources/sap/ushell/qunit/renderers/fiori2/AccessKeysHandler.qunit.html',
    'test-resources/sap/ushell/qunit/renderers/fiori2/DefaultParameters/DefaultParameters.qunit.html',
    'test-resources/sap/ushell/qunit/renderers/fiori2/Lifecycle.qunit.html',
    'test-resources/sap/ushell/qunit/renderers/fiori2/meArea/MeArea.qunit.html',
    'test-resources/sap/ushell/qunit/renderers/fiori2/meArea/UserSettings.qunit.html',
    'test-resources/sap/ushell/qunit/renderers/fiori2/notifications/Notifications.qunit.html',
    'test-resources/sap/ushell/qunit/renderers/fiori2/notifications/Settings.qunit.html',
    'test-resources/sap/ushell/qunit/renderers/fiori2/Renderer.qunit.html',
    'test-resources/sap/ushell/qunit/renderers/fiori2/RendererExtensions.qunit.html',
    'test-resources/sap/ushell/qunit/renderers/fiori2/Shell.qunit.html',
    'test-resources/sap/ushell/qunit/renderers/fiori2/UIActions.qunit.html',
    'test-resources/sap/ushell/qunit/services/AppConfiguration.qunit.html',
    'test-resources/sap/ushell/qunit/services/AppContext.qunit.html',
    'test-resources/sap/ushell/qunit/services/AppLifeCycle.qunit.html',
    'test-resources/sap/ushell/qunit/services/AppState.qunit.html',
    'test-resources/sap/ushell/qunit/services/Bookmark.qunit.html',
    'test-resources/sap/ushell/qunit/services/ClientSideTargetResolution.qunit.html',
    'test-resources/sap/ushell/qunit/services/CommonDataModel.qunit.html',
    'test-resources/sap/ushell/qunit/services/CommonDataModel/PersonalizationProcessor.qunit.html',
    'test-resources/sap/ushell/qunit/services/CommonDataModel/PersonalizationProcessorCDMBlackbox.qunit.html',
    'test-resources/sap/ushell/qunit/services/Container.qunit.html',
    'test-resources/sap/ushell/qunit/services/CrossApplicationNavigation.qunit.html',
    'test-resources/sap/ushell/qunit/services/EndUserFeedback.qunit.html',
    'test-resources/sap/ushell/qunit/services/LaunchPage.qunit.html',
    'test-resources/sap/ushell/qunit/services/Message.qunit.html',
    'test-resources/sap/ushell/qunit/services/NavTargetResolution.qunit.html',
    'test-resources/sap/ushell/qunit/services/NavTargetResolutionCDMBlackbox.qunit.html',
    'test-resources/sap/ushell/qunit/services/Notifications.qunit.html',
    'test-resources/sap/ushell/qunit/services/Personalization.qunit.html',
    'test-resources/sap/ushell/qunit/services/PluginManager.qunit.html',
    'test-resources/sap/ushell/qunit/services/ReferenceResolver.qunit.html',
    'test-resources/sap/ushell/qunit/services/ShellNavigation.History.qunit.html',
    'test-resources/sap/ushell/qunit/services/ShellNavigation.qunit.html',
    'test-resources/sap/ushell/qunit/services/SupportTicket.qunit.html',
    'test-resources/sap/ushell/qunit/services/URLParsing.qunit.html',
    'test-resources/sap/ushell/qunit/services/URLShortening.qunit.html',
    'test-resources/sap/ushell/qunit/services/Ui5ComponentLoader.qunit.html',
    'test-resources/sap/ushell/qunit/services/UsageAnalytics.qunit.html',
    'test-resources/sap/ushell/qunit/services/UserDefaultParameterPersistence.qunit.html',
    'test-resources/sap/ushell/qunit/services/UserDefaultParameters.qunit.html',
    'test-resources/sap/ushell/qunit/services/UserInfo.qunit.html',
    'test-resources/sap/ushell/qunit/services/UserRecents.qunit.html',
    'test-resources/sap/ushell/qunit/services/SmartNavigation.qunit.html',
    'test-resources/sap/ushell/qunit/System.qunit.html',
    'test-resources/sap/ushell/qunit/ui/footerbar/AboutButton.qunit.html',
    'test-resources/sap/ushell/qunit/ui/footerbar/AddBookmarkButton.qunit.html',
    'test-resources/sap/ushell/qunit/ui/footerbar/ContactSupportButton.qunit.html',
    'test-resources/sap/ushell/qunit/ui/footerbar/EndUserFeedback.qunit.html',
    'test-resources/sap/ushell/qunit/ui/footerbar/JamDiscussButton.qunit.html',
    'test-resources/sap/ushell/qunit/ui/footerbar/JamShareButton.qunit.html',
    'test-resources/sap/ushell/qunit/ui/footerbar/LogoutButton.qunit.html',
    'test-resources/sap/ushell/qunit/ui/footerbar/SettingsButton.qunit.html',
    'test-resources/sap/ushell/qunit/ui/footerbar/UserPreferencesButton.qunit.html',
    'test-resources/sap/ushell/qunit/ui/launchpad/AccessibilityCustomData.qunit.html',
    'test-resources/sap/ushell/qunit/ui/launchpad/ActionItem.qunit.html',
    'test-resources/sap/ushell/qunit/ui/launchpad/AnchorItem.qunit.html',
    'test-resources/sap/ushell/qunit/ui/launchpad/AnchorNavigationBar.qunit.html',
    'test-resources/sap/ushell/qunit/ui/launchpad/EmbeddedSupportErrorMessage.qunit.html',
    'test-resources/sap/ushell/qunit/ui/launchpad/Fiori2LoadingDialog.qunit.html',
    'test-resources/sap/ushell/qunit/ui/launchpad/GroupListItem.qunit.html',
    'test-resources/sap/ushell/qunit/ui/launchpad/LinkTileWrapper.qunit.html',
    'test-resources/sap/ushell/qunit/ui/launchpad/LoadingDialog.qunit.html',
    'test-resources/sap/ushell/qunit/ui/launchpad/TileContainer.qunit.html',
    'test-resources/sap/ushell/qunit/ui/launchpad/ViewPortContainer.qunit.html',
    'test-resources/sap/ushell/qunit/ui/shell/FloatingContainer.qunit.html',
    'test-resources/sap/ushell/qunit/ui/shell/RightFloatingContainer.qunit.html',
    'test-resources/sap/ushell/qunit/ui/shell/ShellAppTitle.qunit.html',
    'test-resources/sap/ushell/qunit/ui/shell/ShellLayout.qunit.html',
    'test-resources/sap/ushell/qunit/ui/shell/ShellTitle.qunit.html',
    'test-resources/sap/ushell/qunit/ui/shell/SplitContainer.qunit.html',
    'test-resources/sap/ushell/qunit/ui/tile/DynamicTile.qunit.html',
    'test-resources/sap/ushell/qunit/ui/tile/ImageTile.qunit.html',
    'test-resources/sap/ushell/qunit/ui/tile/StaticTile.qunit.html',
    'test-resources/sap/ushell/qunit/ui/tile/TileBase.qunit.html',
    'test-resources/sap/ushell/qunit/ui5service/ShellUIService.qunit.html'
].map(function (sEntry) {
    var sString = sEntry.match('/([^/]*).qunit.html')[1];
    return {
        key: sString,
        context: {
            systemObjectId: sString,
            path: 'sap/bc/ui5_ui5/ui2/ushell/' + sEntry
        }
    };
}));
exports.oWikis = [
    {
        key: 'FCC ABAP Alignment',
        context: {
            systemObjectId: 'UI2 Support page',
            path: '/unifiedshell/display/FCC+ABAP+Alignment'
        }
    },
    {
        key: 'UI2 test links',
        context: {
            systemObjectId: 'UI2 test links',
            path: 'wiki/display/unifiedshell/Adaption+to+UI5+QUnit+Test+Runner'
        }
    },
    {
        key: 'Support schedule',
        context: {
            systemObjectId: 'TIP Core UI Integration support',
            path: 'wiki/display/TIPCoreUII/Support'
        }
    },
    {
        key: 'UII Support schedule',
        context: {
            systemObjectId: 'TIP Core UI Integration support',
            path: 'wiki/display/TIPCoreUII/Support'
        }
    },
    {
        key: 'CA-UI2-INT-FE support',
        context: {
            systemObjectId: 'CA-UI2-INT-FE support',
            path: 'wiki/display/UICEI/CSS+Message+Dispatching+-+component+CA-UI2-INT-FE'
        }
    },
    {
        key: 'ca-ui2-int-fe support',
        context: {
            systemObjectId: 'ca-ui2-int-fe support',
            path: 'wiki/display/UICEI/CSS+Message+Dispatching+-+component+CA-UI2-INT-FE'
        }
    },
    {
        key: 'UI2 Support page',
        context: {
            systemObjectId: 'CA-UI2-INT-FE support',
            path: 'wiki/display/UICEI/CSS+Message+Dispatching+-+component+CA-UI2-INT-FE'
        }
    },
    {
        key: 'Backend Sprint Reviews',
        context: {
            systemObjectId: 'Backend Sprint Review',
            path: 'wiki/display/UICEI/Tact+Overviews'
        }
    },
    {
        key: 'UI5 patch schedule',
        context: {
            systemObjectId: 'UI5 UI2 Pach plan',
            path: 'wiki/pages/viewpage.action?pageId=1679623157'
        }
    }
];

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tYXRjaC9tYXRjaGRhdGEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7O0dBSUc7OztBQUVZLFFBQUEsVUFBVSxHQUFHO0lBQ3hCO1FBQ0UsR0FBRyxFQUFFLDRCQUE0QjtRQUNqQyxPQUFPLEVBQUU7WUFDUCxjQUFjLEVBQUUsNEJBQTRCO1lBQzVDLElBQUksRUFBRSxxSEFBcUg7U0FDNUg7S0FDRjtJQUNEO1FBQ0UsR0FBRyxFQUFFLHdCQUF3QjtRQUM3QixPQUFPLEVBQUU7WUFDUCxjQUFjLEVBQUUsd0JBQXdCO1lBQ3hDLElBQUksRUFBRSwwR0FBMEc7U0FDakg7S0FDRjtJQUNEO1FBQ0UsR0FBRyxFQUFFLFlBQVk7UUFDakIsT0FBTyxFQUFFO1lBQ1AsY0FBYyxFQUFFLFlBQVk7WUFDNUIsSUFBSSxFQUFFLGdGQUFnRjtTQUN2RjtLQUNGO0lBQ0Q7UUFDRSxHQUFHLEVBQUUsYUFBYTtRQUNsQixPQUFPLEVBQUU7WUFDUCxjQUFjLEVBQUUsYUFBYTtZQUM3QixJQUFJLEVBQUUsK0VBQStFO1NBQ3RGO0tBQ0Y7SUFDRDtRQUNFLEdBQUcsRUFBRSxlQUFlO1FBQ3BCLE9BQU8sRUFBRTtZQUNQLGNBQWMsRUFBRSxlQUFlO1lBQy9CLElBQUksRUFBRSxzREFBc0Q7U0FDN0Q7S0FDRjtJQUNEO1FBQ0UsR0FBRyxFQUFFLHFCQUFxQjtRQUMxQixPQUFPLEVBQUU7WUFDUCxjQUFjLEVBQUUscUJBQXFCO1lBQ3JDLElBQUksRUFBRSxrQ0FBa0M7U0FDekM7S0FDRjtDQUNGLENBQUMsTUFBTSxDQUFDO0lBQ1AsMEJBQTBCO0lBQzFCLDJGQUEyRjtJQUMzRixnRkFBZ0Y7SUFDaEYsMkVBQTJFO0lBRTNFLDJFQUEyRTtJQUMzRSw2RkFBNkY7SUFDN0YsNEVBQTRFO0lBQzVFLGtGQUFrRjtJQUNsRixzRkFBc0Y7SUFDdEYsa0ZBQWtGO0lBQ2xGLG9GQUFvRjtJQUNwRixrR0FBa0c7SUFDbEcsMkVBQTJFO0lBRTNFLDhEQUE4RDtJQUM5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QUN2QixPQUFPLEVBQUU7WUFDUCxjQUFjLEVBQUUsaUNBQWlDO1lBQ2pELElBQUksRUFBRSxpQ0FBaUM7U0FDeEM7S0FDRjtJQUNEO1FBQ0UsR0FBRyxFQUFFLHNCQUFzQjtRQUMzQixPQUFPLEVBQUU7WUFDUCxjQUFjLEVBQUUsaUNBQWlDO1lBQ2pELElBQUksRUFBRSxpQ0FBaUM7U0FDeEM7S0FDRjtJQUNEO1FBQ0UsR0FBRyxFQUFFLHVCQUF1QjtRQUM1QixPQUFPLEVBQUU7WUFDUCxjQUFjLEVBQUUsdUJBQXVCO1lBQ3ZDLElBQUksRUFBRSxzRUFBc0U7U0FDN0U7S0FDRjtJQUNEO1FBQ0UsR0FBRyxFQUFFLHVCQUF1QjtRQUM1QixPQUFPLEVBQUU7WUFDUCxjQUFjLEVBQUUsdUJBQXVCO1lBQ3ZDLElBQUksRUFBRSxzRUFBc0U7U0FDN0U7S0FDRjtJQUNEO1FBQ0UsR0FBRyxFQUFFLGtCQUFrQjtRQUN2QixPQUFPLEVBQUU7WUFDUCxjQUFjLEVBQUUsdUJBQXVCO1lBQ3ZDLElBQUksRUFBRSxzRUFBc0U7U0FDN0U7S0FDRjtJQUNEO1FBQ0UsR0FBRyxFQUFFLHdCQUF3QjtRQUM3QixPQUFPLEVBQUU7WUFDUCxjQUFjLEVBQUUsdUJBQXVCO1lBQ3ZDLElBQUksRUFBRSxtQ0FBbUM7U0FDMUM7S0FDRjtJQUNEO1FBQ0UsR0FBRyxFQUFFLG9CQUFvQjtRQUN6QixPQUFPLEVBQUU7WUFDUCxjQUFjLEVBQUUsbUJBQW1CO1lBQ25DLElBQUksRUFBRSw4Q0FBOEM7U0FDckQ7S0FDRjtDQUNGLENBQUEiLCJmaWxlIjoibWF0Y2gvbWF0Y2hkYXRhLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAZmlsZVxuICogQG1vZHVsZSBqZnNlYi5mZGV2c3RhcnQubWF0Y2hkYXRhXG4gKiBAY29weXJpZ2h0IChjKSAyMDE2IEdlcmQgRm9yc3RtYW5uXG4gKi9cblxuICBleHBvcnQgY29uc3Qgb1VuaXRUZXN0cyA9IFtcbiAgICB7XG4gICAgICBrZXk6ICdDbGllbnRTaWRlVGFyZ2V0UmVzb2x1dGlvbicsXG4gICAgICBjb250ZXh0OiB7XG4gICAgICAgIHN5c3RlbU9iamVjdElkOiAnQ2xpZW50U2lkZVRhcmdldFJlc29sdXRpb24nLFxuICAgICAgICBwYXRoOiAnc2FwL2JjL3VpNV91aTUvdWkyL3VzaGVsbC90ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L2FkYXB0ZXJzL2NkbS9DbGllbnRTaWRlVGFyZ2V0UmVzb2x1dGlvbkFkYXB0ZXIucXVuaXQuaHRtbCdcbiAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgIGtleTogJ0NvbW1vbkRhdGFNb2RlbEFkYXB0ZXInLFxuICAgICAgY29udGV4dDoge1xuICAgICAgICBzeXN0ZW1PYmplY3RJZDogJ0NvbW1vbkRhdGFNb2RlbEFkYXB0ZXInLFxuICAgICAgICBwYXRoOiAnc2FwL2JjL3VpNV91aTUvdWkyL3VzaGVsbC90ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L2FkYXB0ZXJzL2NkbS9Db21tb25EYXRhTW9kZWxBZGFwdGVyLnF1bml0Lmh0bWwnXG4gICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICBrZXk6ICd1c2hlbGwgbGliJyxcbiAgICAgIGNvbnRleHQ6IHtcbiAgICAgICAgc3lzdGVtT2JqZWN0SWQ6ICd1c2hlbGwgbGliJyxcbiAgICAgICAgcGF0aDogJ3NhcC9iYy91aTVfdWk1L3VpMi91c2hlbGwvdGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC90ZXN0c3VpdGUucXVuaXQuaHRtbCdcbiAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgIGtleTogJ3VzaGVsbF9hYmFwJyxcbiAgICAgIGNvbnRleHQ6IHtcbiAgICAgICAgc3lzdGVtT2JqZWN0SWQ6ICd1c2hlbGxfYWJhcCcsXG4gICAgICAgIHBhdGg6ICdzYXAvYmMvdWk1X3VpNS91aTIvdXNoZWxsL3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGxfYWJhcC90ZXN0c3VpdGUucXVuaXQuaHRtbCdcbiAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgIGtleTogJ3VpMiBzaGVsbCBhcGknLFxuICAgICAgY29udGV4dDoge1xuICAgICAgICBzeXN0ZW1PYmplY3RJZDogJ3VpMiBzaGVsbCBhcGknLFxuICAgICAgICBwYXRoOiAnc2FwL3B1YmxpYy9iYy91aTIvc2VydmljZXMvdGVzdC90ZXN0c3VpdGUucXVuaXQuaHRtbCdcbiAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgIGtleTogJ1NoZWxsLmNvbnRyb2xsZXIuanMnLFxuICAgICAgY29udGV4dDoge1xuICAgICAgICBzeXN0ZW1PYmplY3RJZDogJ1NoZWxsLmNvbnRyb2xsZXIuanMnLFxuICAgICAgICBwYXRoOiAnL3NhcC9iYy90ZXN0L1NoZWxsLmNvbnRyb2xsZXIuanMnXG4gICAgICB9XG4gICAgfVxuICBdLmNvbmNhdChbXG4gICAgLy8gYWxwaGFiZXRpYyBvcmRlciBwbGVhc2VcbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC9hZGFwdGVycy9jZG0vQ2xpZW50U2lkZVRhcmdldFJlc29sdXRpb25BZGFwdGVyLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L2FkYXB0ZXJzL2NkbS9Db21tb25EYXRhTW9kZWxBZGFwdGVyLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L2FkYXB0ZXJzL2NkbS9MYXVuY2hQYWdlQWRhcHRlci5xdW5pdC5odG1sJyxcblxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L2FkYXB0ZXJzL2xvY2FsL0FwcFN0YXRlQWRhcHRlci5xdW5pdC5odG1sJyxcbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC9hZGFwdGVycy9sb2NhbC9DbGllbnRTaWRlVGFyZ2V0UmVzb2x1dGlvbkFkYXB0ZXIucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvYWRhcHRlcnMvbG9jYWwvQ29udGFpbmVyQWRhcHRlci5xdW5pdC5odG1sJyxcbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC9hZGFwdGVycy9sb2NhbC9FbmRVc2VyRmVlZGJhY2tBZGFwdGVyLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L2FkYXB0ZXJzL2xvY2FsL05hdlRhcmdldFJlc29sdXRpb25BZGFwdGVyLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L2FkYXB0ZXJzL2xvY2FsL1BlcnNvbmFsaXphdGlvbkFkYXB0ZXIucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvYWRhcHRlcnMvbG9jYWwvU3VwcG9ydFRpY2tldEFkYXB0ZXJUZXN0LnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L2FkYXB0ZXJzL2xvY2FsL1VzZXJEZWZhdWx0UGFyYW1ldGVyUGVyc2lzdGVuY2VBZGFwdGVyLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L2FkYXB0ZXJzL2xvY2FsL1VzZXJJbmZvQWRhcHRlci5xdW5pdC5odG1sJyxcblxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L2Jvb3RzdHJhcC9zYW5kYm94LnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L0NhbnZhc1NoYXBlc01hbmFnZXIucXVuaXQuaHRtbCcsXG5cbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC9jb21wb25lbnRzL2NvbnRhaW5lci9BcHBsaWNhdGlvbkNvbnRhaW5lci5xdW5pdC5odG1sJyxcbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC9jb21wb25lbnRzL2ZhY3RzaGVldC9hbm5vdGF0aW9uL09EYXRhVVJMVGVtcGxhdGluZy5xdW5pdC5odG1sJyxcbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC9jb21wb25lbnRzL2ZscC9Db21wb25lbnRLZXlzSGFuZGxlci5xdW5pdC5odG1sJyxcbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC9jb21wb25lbnRzL2ZscC9GbHBBcHAucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvY29tcG9uZW50cy9mbHAvbGF1bmNocGFkL2FwcGZpbmRlci9FYXN5QWNjZXNzLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L2NvbXBvbmVudHMvZmxwL2xhdW5jaHBhZC9EYXNoYm9hcmRNYW5hZ2VyLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L2NvbXBvbmVudHMvZmxwL2xhdW5jaHBhZC9QYWdpbmdNYW5hZ2VyLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L2NvbXBvbmVudHMvZmxwL2xhdW5jaHBhZC9hcHBmaW5kZXIvQXBwRmluZGVyLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L2NvbXBvbmVudHMvZmxwL2xhdW5jaHBhZC9hcHBmaW5kZXIvR3JvdXBMaXN0UG9wb3Zlci5xdW5pdC5odG1sJyxcbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC9jb21wb25lbnRzL2ZscC9sYXVuY2hwYWQvYXBwZmluZGVyL0hpZXJhcmNoeUFwcHMucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvY29tcG9uZW50cy9mbHAvbGF1bmNocGFkL2FwcGZpbmRlci9IaWVyYXJjaHlGb2xkZXJzLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L3JlbmRlcmVycy9maW9yaTIvdXNlclByZWZlcmVuY2VzL0xhbmd1YWdlUmVnaW9uU2VsZWN0b3IucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvY29tcG9uZW50cy9mbHAvbGF1bmNocGFkL2Rhc2hib2FyZC9EYXNoYm9hcmRDb250ZW50LnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L2NvbXBvbmVudHMvZmxwL2xhdW5jaHBhZC9kYXNoYm9hcmQvRGFzaGJvYXJkVUlBY3Rpb25zLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L2NvbXBvbmVudHMvZmxwL3NldHRpbmdzL0ZscFNldHRpbmdzLnF1bml0Lmh0bWwnLFxuXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvY29tcG9uZW50cy90aWxlcy9hcHBsYXVuY2hlci9TdGF0aWNUaWxlLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L2NvbXBvbmVudHMvdGlsZXMvYXBwbGF1bmNoZXJkeW5hbWljL0R5bmFtaWNUaWxlLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L2NvbXBvbmVudHMvdGlsZXMvY2RtL2FwcGxhdW5jaGVyL1N0YXRpY1RpbGUucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvY29tcG9uZW50cy90aWxlcy9jZG0vYXBwbGF1bmNoZXJkeW5hbWljL0R5bmFtaWNUaWxlLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L2NvbXBvbmVudHMvdGlsZXMvdXRpbHMucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvY29tcG9uZW50cy90aWxlcy91dGlsc1JULnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L2NvbXBvbmVudHMvdXNlckFjdGl2aXR5L3VzZXJBY3Rpdml0eUxvZy5xdW5pdC5odG1sJyxcblxuICAgIC8vIFwidGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC9kZW1vYXBwcy9Vc2VyRGVmYXVsdFBsdWdpblNhbXBsZS9Vc2VyRGVmYXVsdFBsdWdpblNhbXBsZS5xdW5pdC5odG1sXCIsIC8vIEN1cnJlbnRseSBub3QgcnVuIGluc2lkZSB0aGUgUVVuaXQgVGVzdCBMb2FkZXIgZm9yIHVzaGVsbC1saWJcbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC9GTFBBbmFseXRpY3MucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvTGF5b3V0LnF1bml0Lmh0bWwnLFxuXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvcmVuZGVyZXJzL2Zpb3JpMi9BY2Nlc3NLZXlzSGFuZGxlci5xdW5pdC5odG1sJyxcbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC9yZW5kZXJlcnMvZmlvcmkyL0RlZmF1bHRQYXJhbWV0ZXJzL0RlZmF1bHRQYXJhbWV0ZXJzLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L3JlbmRlcmVycy9maW9yaTIvTGlmZWN5Y2xlLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L3JlbmRlcmVycy9maW9yaTIvbWVBcmVhL01lQXJlYS5xdW5pdC5odG1sJyxcbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC9yZW5kZXJlcnMvZmlvcmkyL21lQXJlYS9Vc2VyU2V0dGluZ3MucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvcmVuZGVyZXJzL2Zpb3JpMi9ub3RpZmljYXRpb25zL05vdGlmaWNhdGlvbnMucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvcmVuZGVyZXJzL2Zpb3JpMi9ub3RpZmljYXRpb25zL1NldHRpbmdzLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L3JlbmRlcmVycy9maW9yaTIvUmVuZGVyZXIucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvcmVuZGVyZXJzL2Zpb3JpMi9SZW5kZXJlckV4dGVuc2lvbnMucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvcmVuZGVyZXJzL2Zpb3JpMi9TaGVsbC5xdW5pdC5odG1sJyxcbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC9yZW5kZXJlcnMvZmlvcmkyL1VJQWN0aW9ucy5xdW5pdC5odG1sJyxcblxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L3NlcnZpY2VzL0FwcENvbmZpZ3VyYXRpb24ucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvc2VydmljZXMvQXBwQ29udGV4dC5xdW5pdC5odG1sJyxcbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC9zZXJ2aWNlcy9BcHBMaWZlQ3ljbGUucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvc2VydmljZXMvQXBwU3RhdGUucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvc2VydmljZXMvQm9va21hcmsucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvc2VydmljZXMvQ2xpZW50U2lkZVRhcmdldFJlc29sdXRpb24ucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvc2VydmljZXMvQ29tbW9uRGF0YU1vZGVsLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L3NlcnZpY2VzL0NvbW1vbkRhdGFNb2RlbC9QZXJzb25hbGl6YXRpb25Qcm9jZXNzb3IucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvc2VydmljZXMvQ29tbW9uRGF0YU1vZGVsL1BlcnNvbmFsaXphdGlvblByb2Nlc3NvckNETUJsYWNrYm94LnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L3NlcnZpY2VzL0NvbnRhaW5lci5xdW5pdC5odG1sJyxcbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC9zZXJ2aWNlcy9Dcm9zc0FwcGxpY2F0aW9uTmF2aWdhdGlvbi5xdW5pdC5odG1sJyxcbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC9zZXJ2aWNlcy9FbmRVc2VyRmVlZGJhY2sucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvc2VydmljZXMvTGF1bmNoUGFnZS5xdW5pdC5odG1sJyxcbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC9zZXJ2aWNlcy9NZXNzYWdlLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L3NlcnZpY2VzL05hdlRhcmdldFJlc29sdXRpb24ucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvc2VydmljZXMvTmF2VGFyZ2V0UmVzb2x1dGlvbkNETUJsYWNrYm94LnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L3NlcnZpY2VzL05vdGlmaWNhdGlvbnMucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvc2VydmljZXMvUGVyc29uYWxpemF0aW9uLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L3NlcnZpY2VzL1BsdWdpbk1hbmFnZXIucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvc2VydmljZXMvUmVmZXJlbmNlUmVzb2x2ZXIucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvc2VydmljZXMvU2hlbGxOYXZpZ2F0aW9uLkhpc3RvcnkucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvc2VydmljZXMvU2hlbGxOYXZpZ2F0aW9uLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L3NlcnZpY2VzL1N1cHBvcnRUaWNrZXQucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvc2VydmljZXMvVVJMUGFyc2luZy5xdW5pdC5odG1sJyxcbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC9zZXJ2aWNlcy9VUkxTaG9ydGVuaW5nLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L3NlcnZpY2VzL1VpNUNvbXBvbmVudExvYWRlci5xdW5pdC5odG1sJyxcbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC9zZXJ2aWNlcy9Vc2FnZUFuYWx5dGljcy5xdW5pdC5odG1sJyxcbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC9zZXJ2aWNlcy9Vc2VyRGVmYXVsdFBhcmFtZXRlclBlcnNpc3RlbmNlLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L3NlcnZpY2VzL1VzZXJEZWZhdWx0UGFyYW1ldGVycy5xdW5pdC5odG1sJyxcbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC9zZXJ2aWNlcy9Vc2VySW5mby5xdW5pdC5odG1sJyxcbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC9zZXJ2aWNlcy9Vc2VyUmVjZW50cy5xdW5pdC5odG1sJyxcbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC9zZXJ2aWNlcy9TbWFydE5hdmlnYXRpb24ucXVuaXQuaHRtbCcsXG5cbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC9TeXN0ZW0ucXVuaXQuaHRtbCcsXG5cbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC91aS9mb290ZXJiYXIvQWJvdXRCdXR0b24ucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvdWkvZm9vdGVyYmFyL0FkZEJvb2ttYXJrQnV0dG9uLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L3VpL2Zvb3RlcmJhci9Db250YWN0U3VwcG9ydEJ1dHRvbi5xdW5pdC5odG1sJyxcbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC91aS9mb290ZXJiYXIvRW5kVXNlckZlZWRiYWNrLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L3VpL2Zvb3RlcmJhci9KYW1EaXNjdXNzQnV0dG9uLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L3VpL2Zvb3RlcmJhci9KYW1TaGFyZUJ1dHRvbi5xdW5pdC5odG1sJyxcbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC91aS9mb290ZXJiYXIvTG9nb3V0QnV0dG9uLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L3VpL2Zvb3RlcmJhci9TZXR0aW5nc0J1dHRvbi5xdW5pdC5odG1sJyxcbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC91aS9mb290ZXJiYXIvVXNlclByZWZlcmVuY2VzQnV0dG9uLnF1bml0Lmh0bWwnLFxuXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvdWkvbGF1bmNocGFkL0FjY2Vzc2liaWxpdHlDdXN0b21EYXRhLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L3VpL2xhdW5jaHBhZC9BY3Rpb25JdGVtLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L3VpL2xhdW5jaHBhZC9BbmNob3JJdGVtLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L3VpL2xhdW5jaHBhZC9BbmNob3JOYXZpZ2F0aW9uQmFyLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L3VpL2xhdW5jaHBhZC9FbWJlZGRlZFN1cHBvcnRFcnJvck1lc3NhZ2UucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvdWkvbGF1bmNocGFkL0Zpb3JpMkxvYWRpbmdEaWFsb2cucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvdWkvbGF1bmNocGFkL0dyb3VwTGlzdEl0ZW0ucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvdWkvbGF1bmNocGFkL0xpbmtUaWxlV3JhcHBlci5xdW5pdC5odG1sJyxcbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC91aS9sYXVuY2hwYWQvTG9hZGluZ0RpYWxvZy5xdW5pdC5odG1sJyxcbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC91aS9sYXVuY2hwYWQvVGlsZUNvbnRhaW5lci5xdW5pdC5odG1sJyxcbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC91aS9sYXVuY2hwYWQvVmlld1BvcnRDb250YWluZXIucXVuaXQuaHRtbCcsXG5cbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC91aS9zaGVsbC9GbG9hdGluZ0NvbnRhaW5lci5xdW5pdC5odG1sJyxcbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC91aS9zaGVsbC9SaWdodEZsb2F0aW5nQ29udGFpbmVyLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L3VpL3NoZWxsL1NoZWxsQXBwVGl0bGUucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvdWkvc2hlbGwvU2hlbGxMYXlvdXQucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvdWkvc2hlbGwvU2hlbGxUaXRsZS5xdW5pdC5odG1sJyxcbiAgICAndGVzdC1yZXNvdXJjZXMvc2FwL3VzaGVsbC9xdW5pdC91aS9zaGVsbC9TcGxpdENvbnRhaW5lci5xdW5pdC5odG1sJyxcblxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L3VpL3RpbGUvRHluYW1pY1RpbGUucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvdWkvdGlsZS9JbWFnZVRpbGUucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvdWkvdGlsZS9TdGF0aWNUaWxlLnF1bml0Lmh0bWwnLFxuICAgICd0ZXN0LXJlc291cmNlcy9zYXAvdXNoZWxsL3F1bml0L3VpL3RpbGUvVGlsZUJhc2UucXVuaXQuaHRtbCcsXG4gICAgJ3Rlc3QtcmVzb3VyY2VzL3NhcC91c2hlbGwvcXVuaXQvdWk1c2VydmljZS9TaGVsbFVJU2VydmljZS5xdW5pdC5odG1sJ1xuICBdLm1hcChmdW5jdGlvbiAoc0VudHJ5KSB7XG4gICAgdmFyIHNTdHJpbmcgPSBzRW50cnkubWF0Y2goJy8oW14vXSopLnF1bml0Lmh0bWwnKVsxXVxuICAgIHJldHVybiB7XG4gICAgICBrZXk6IHNTdHJpbmcsXG4gICAgICBjb250ZXh0OiB7XG4gICAgICAgIHN5c3RlbU9iamVjdElkOiBzU3RyaW5nLFxuICAgICAgICBwYXRoOiAnc2FwL2JjL3VpNV91aTUvdWkyL3VzaGVsbC8nICsgc0VudHJ5XG4gICAgICB9XG4gICAgfVxuICB9KSlcblxuZXhwb3J0IGNvbnN0IG9XaWtpcyA9IFtcbiAgICB7XG4gICAgICBrZXk6ICdGQ0MgQUJBUCBBbGlnbm1lbnQnLFxuICAgICAgY29udGV4dDoge1xuICAgICAgICBzeXN0ZW1PYmplY3RJZDogJ1VJMiBTdXBwb3J0IHBhZ2UnLFxuICAgICAgICBwYXRoOiAnL3VuaWZpZWRzaGVsbC9kaXNwbGF5L0ZDQytBQkFQK0FsaWdubWVudCdcbiAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgIGtleTogJ1VJMiB0ZXN0IGxpbmtzJyxcbiAgICAgIGNvbnRleHQ6IHtcbiAgICAgICAgc3lzdGVtT2JqZWN0SWQ6ICdVSTIgdGVzdCBsaW5rcycsXG4gICAgICAgIHBhdGg6ICd3aWtpL2Rpc3BsYXkvdW5pZmllZHNoZWxsL0FkYXB0aW9uK3RvK1VJNStRVW5pdCtUZXN0K1J1bm5lcidcbiAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgIGtleTogJ1N1cHBvcnQgc2NoZWR1bGUnLFxuICAgICAgY29udGV4dDoge1xuICAgICAgICBzeXN0ZW1PYmplY3RJZDogJ1RJUCBDb3JlIFVJIEludGVncmF0aW9uIHN1cHBvcnQnLFxuICAgICAgICBwYXRoOiAnd2lraS9kaXNwbGF5L1RJUENvcmVVSUkvU3VwcG9ydCdcbiAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgIGtleTogJ1VJSSBTdXBwb3J0IHNjaGVkdWxlJyxcbiAgICAgIGNvbnRleHQ6IHtcbiAgICAgICAgc3lzdGVtT2JqZWN0SWQ6ICdUSVAgQ29yZSBVSSBJbnRlZ3JhdGlvbiBzdXBwb3J0JyxcbiAgICAgICAgcGF0aDogJ3dpa2kvZGlzcGxheS9USVBDb3JlVUlJL1N1cHBvcnQnXG4gICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICBrZXk6ICdDQS1VSTItSU5ULUZFIHN1cHBvcnQnLFxuICAgICAgY29udGV4dDoge1xuICAgICAgICBzeXN0ZW1PYmplY3RJZDogJ0NBLVVJMi1JTlQtRkUgc3VwcG9ydCcsXG4gICAgICAgIHBhdGg6ICd3aWtpL2Rpc3BsYXkvVUlDRUkvQ1NTK01lc3NhZ2UrRGlzcGF0Y2hpbmcrLStjb21wb25lbnQrQ0EtVUkyLUlOVC1GRSdcbiAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgIGtleTogJ2NhLXVpMi1pbnQtZmUgc3VwcG9ydCcsXG4gICAgICBjb250ZXh0OiB7XG4gICAgICAgIHN5c3RlbU9iamVjdElkOiAnY2EtdWkyLWludC1mZSBzdXBwb3J0JyxcbiAgICAgICAgcGF0aDogJ3dpa2kvZGlzcGxheS9VSUNFSS9DU1MrTWVzc2FnZStEaXNwYXRjaGluZystK2NvbXBvbmVudCtDQS1VSTItSU5ULUZFJ1xuICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAga2V5OiAnVUkyIFN1cHBvcnQgcGFnZScsXG4gICAgICBjb250ZXh0OiB7XG4gICAgICAgIHN5c3RlbU9iamVjdElkOiAnQ0EtVUkyLUlOVC1GRSBzdXBwb3J0JyxcbiAgICAgICAgcGF0aDogJ3dpa2kvZGlzcGxheS9VSUNFSS9DU1MrTWVzc2FnZStEaXNwYXRjaGluZystK2NvbXBvbmVudCtDQS1VSTItSU5ULUZFJ1xuICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAga2V5OiAnQmFja2VuZCBTcHJpbnQgUmV2aWV3cycsXG4gICAgICBjb250ZXh0OiB7XG4gICAgICAgIHN5c3RlbU9iamVjdElkOiAnQmFja2VuZCBTcHJpbnQgUmV2aWV3JyxcbiAgICAgICAgcGF0aDogJ3dpa2kvZGlzcGxheS9VSUNFSS9UYWN0K092ZXJ2aWV3cydcbiAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgIGtleTogJ1VJNSBwYXRjaCBzY2hlZHVsZScsXG4gICAgICBjb250ZXh0OiB7XG4gICAgICAgIHN5c3RlbU9iamVjdElkOiAnVUk1IFVJMiBQYWNoIHBsYW4nLFxuICAgICAgICBwYXRoOiAnd2lraS9wYWdlcy92aWV3cGFnZS5hY3Rpb24/cGFnZUlkPTE2Nzk2MjMxNTcnXG4gICAgICB9XG4gICAgfVxuICBdXG4iXX0=
