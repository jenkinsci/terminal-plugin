package hudson.plugins.terminal;

import hudson.Extension;
import hudson.model.RootAction;
import hudson.model.Hudson;

@Extension
public class TerminalAction implements RootAction {

    public String getIconFileName() {
        if (Hudson.getInstance().getACL().hasPermission(Hudson.ADMINISTER)) {
            return "terminal.gif";
        }
        return null;
    }

    public String getDisplayName() {
        return "Terminal";
    }

    public String getUrlName() {
        return "#terminal";
    }

}
