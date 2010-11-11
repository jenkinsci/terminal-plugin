package hudson.plugins.terminal;

import hudson.Extension;
import hudson.model.Hudson;
import hudson.model.Node;
import hudson.widgets.Widget;
import net.sf.json.JSONSerializer;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.collections.Transformer;

@Extension
public class TerminalWidget extends Widget {

    @Override
    public String getUrlName() {
        return "terminal";
    }

    public static String getNodeNames() {
        return JSONSerializer.toJSON(CollectionUtils.collect(Hudson.getInstance().getNodes(), new Transformer() {
            public Object transform(Object input) {
                return ((Node) input).getNodeName();
            }
        })).toString();
    }
}
