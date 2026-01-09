import * as React from 'react';
import * as ReactDOM from 'react-dom';

interface IPortalProps {
    children: React.ReactNode;
}

const Portal: React.FC<IPortalProps> = ({ children }) => {
    const [container] = React.useState(() => {
        const el = document.createElement('div');
        el.style.position = 'fixed';
        el.style.zIndex = '999999';
        el.style.top = '0';
        el.style.left = '0';
        el.style.width = '100%';
        el.style.height = '100%';
        el.style.pointerEvents = 'none';
        return el;
    });

    React.useEffect(() => {
        document.body.appendChild(container);
        return () => {
            if (document.body.contains(container)) {
                document.body.removeChild(container);
            }
        };
    }, [container]);

    return ReactDOM.createPortal(children, container);
};

export default Portal;
