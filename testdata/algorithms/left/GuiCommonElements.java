/*
 * ome.formats.importer.gui.GuiCommonElements
 *
 *------------------------------------------------------------------------------
 *  Copyright (C) 2006-2008 University of Dundee. All rights reserved.
 *
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 2 of the License, or
 *  (at your option) any later version.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *  
 *  You should have received a copy of the GNU General Public License along
 *  with this program; if not, write to the Free Software Foundation, Inc.,
 *  51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 *------------------------------------------------------------------------------
 */

package ome.formats.importer.gui;

import info.clearthought.layout.TableLayout;

import java.awt.Color;
import java.awt.Component;
import java.awt.Container;
import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.Insets;
import java.awt.Toolkit;
import java.awt.event.KeyEvent;
import java.text.NumberFormat;
import java.text.ParseException;
import java.util.Locale;

import javax.swing.BorderFactory;
import javax.swing.ImageIcon;
import javax.swing.JButton;
import javax.swing.JCheckBox;
import javax.swing.JComboBox;
import javax.swing.JComponent;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JPasswordField;
import javax.swing.JRadioButton;
import javax.swing.JScrollPane;
import javax.swing.JTextArea;
import javax.swing.JTextField;
import javax.swing.JTextPane;
import javax.swing.KeyStroke;
import javax.swing.UIManager;
import javax.swing.border.Border;
import javax.swing.text.AttributeSet;
import javax.swing.text.BadLocationException;
import javax.swing.text.DefaultStyledDocument;
import javax.swing.text.Document;
import javax.swing.text.PlainDocument;
import javax.swing.text.Style;
import javax.swing.text.StyleConstants;
import javax.swing.text.StyleContext;
import javax.swing.text.StyledDocument;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

/**
 * Common helper methods used by various gui elements. This class depends on TableLayout available from
 * the sun java website.
 * 
 * @author Brian Loranger brain at lifesci.dundee.ac.uk
 */
public class GuiCommonElements
{
	/** Logger for this class */
	private static Log log = LogFactory.getLog(GuiCommonElements.class);

    /**
     * @return true if using a mac
     */
    public static boolean getIsMac() 
    {
        String laf = UIManager.getLookAndFeel().getClass().getName();
        if (laf.equals("apple.laf.AquaLookAndFeel") || laf.equals("ch.randelshofer.quaqua.QuaquaLookAndFeel")) 
            return true;
        else
            return false;
    }
    
	/**
	 * @return true if look and feel is motif
	 */
	public static boolean isMotif() {
		String laf = UIManager.getLookAndFeel().getClass().getName();
        if (laf.equals("com.sun.java.swing.plaf.motif.MotifLookAndFeel"))
            return true;
        else
        	return false;
	}
        
    /**
     * Add a 'main panel' to a Frame or other container
     * 
     * @param container - parent container
     * @param tableSize - TableLayout table array
     * @param margin_top - top margin
     * @param margin_left - left margin
     * @param margin_bottom - bottom margin
     * @param margin_right - right margin
     * @param debug - turn on/off red debug borders
     * @return new JPanel
     */
    public static JPanel addMainPanel(Container container, double tableSize[][], 
            int margin_top, int margin_left, int margin_bottom, int margin_right,
            boolean debug)
    {
        JPanel panel = new JPanel();
        panel.setOpaque(false);
              
        TableLayout layout = new TableLayout(tableSize);
        panel.setLayout(layout);       
        panel.setBorder(BorderFactory.createEmptyBorder(margin_top,margin_left,
                margin_bottom,margin_right));

        if (debug == true)
        panel.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(Color.red),
                panel.getBorder()));
        
        return panel;
    }
    
    /**
     * Add a bordered 'sub-panel' with title to a container
     * 
     * @param container - parent container
     * @param tableSize - TableLayout table array
     * @param name - panel name
     * @param debug - turn on/off red debug borders
     * @return new JPanel
     */
    public static JPanel addBorderedPanel(Container container, double tableSize[][], 
            String name,
            boolean debug)
    {
        JPanel panel = new JPanel();
        panel.setOpaque(false);
              
        TableLayout layout = new TableLayout(tableSize);
        panel.setLayout(layout);       
        panel.setBorder(BorderFactory.createTitledBorder(name));

        if (debug == true)
        panel.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(Color.red),
                panel.getBorder()));
        
        return panel;
    }
    
    /**
     * Add a plane sub-panel to an existing container
     * 
     * @param container - parent container
     * @param tableSize - TableLayout table array
     * @param debug - turn on/off red debug borders
     * @return new JPanel
     */
    public static JPanel addPlanePanel(Container container, double tableSize[][], 
            boolean debug)
    {
        JPanel panel = new JPanel();
        panel.setOpaque(false);
              
        TableLayout layout = new TableLayout(tableSize);
        panel.setLayout(layout);       
        panel.setBorder(BorderFactory.createEmptyBorder());

        if (debug == true)
        panel.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(Color.red),
                panel.getBorder()));
        
        return panel;
    }

    /**
     * Add a text pane to the parent container
     * 
     * @param container - parent container
     * @param text - text for new Text Pane
     * @param placement - TableLayout placement within the parent container
     * @param debug - turn on/off red debug borders
     * @return new JTextPane
     */
    public static synchronized JTextPane addTextPane(Container container, String text, 
            String placement, boolean debug)
    {
        StyleContext context = new StyleContext();
        StyledDocument document = new DefaultStyledDocument(context);

        Style style = context.getStyle(StyleContext.DEFAULT_STYLE);
        StyleConstants.setAlignment(style, StyleConstants.ALIGN_LEFT);

        try
        {
            document.insertString(document.getLength(), text, null);
        } catch (BadLocationException e)
        {
        	log.error("BadLocationException inserting text to document.");
        }

        JTextPane textPane = new JTextPane(document);
        textPane.setOpaque(false);
        textPane.setEditable(false);
        textPane.setFocusable(false);
        container.add(textPane, placement);
        
        if (debug == true)
        textPane.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(Color.red),
                textPane.getBorder()));

        return textPane;
    }
 
    /**
     * A version of addTextPane that lets you add a style and context
     * 
     * @param container - parent container
     * @param text - text for new Text Pane
     * @param placement - TableLayout placement within the parent container
     * @param context - context for new text pane
     * @param style - style to apply to new text pane
     * @param debug - turn on/off red debug borders
     * @return new JTextPane
     */
    public static synchronized JTextPane addTextPane(Container container, String text, 
            String placement, StyleContext context, Style style, boolean debug)
    {
        StyledDocument document = new DefaultStyledDocument(context);

        try
        {
            document.insertString(document.getLength(), text, style);
        } catch (BadLocationException e)
        {
        	log.error("BadLocationException inserting text to document.");
        }

        JTextPane textPane = new JTextPane(document);
        textPane.setOpaque(false);
        textPane.setEditable(false);
        textPane.setFocusable(false);
        container.add(textPane, placement);
        
        if (debug == true)
        textPane.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(Color.red),
                textPane.getBorder()));

        return textPane;
    }

    /**
     * Add a new Text Field
     * 
     * @param container - parent container
     * @param name - name of text field
     * @param initialValue - initial value of text field
     * @param mnemonic - mnemonic key
     * @param tooltip - tool tip for field
     * @param suffix - suffix text for field
     * @param labelWidth - label width 
     * @param placement - TableLayout placement
     * @param debug - turn on/off red debug borders
     * @return JTextField
     */
    public static JTextField addTextField(Container container, String name,
            String initialValue, int mnemonic, String tooltip, 
            String suffix, double labelWidth, String placement, boolean debug)
    {

        double[][] size = null;
        
        JPanel panel = new JPanel();
        panel.setOpaque(false);
        
        if (suffix.equals(""))
            size = new double[][]{{labelWidth,TableLayout.FILL},{30}};
        else
            size = new double[][] 
                   {{labelWidth,TableLayout.FILL, TableLayout.PREFERRED},{30}};
     
        TableLayout layout = new TableLayout(size);
        panel.setLayout(layout);       

        JLabel label = new JLabel(name);
        label.setDisplayedMnemonic(mnemonic);     
        JTextField result = new JTextField(20);
        label.setLabelFor(result);
        label.setOpaque(false);
        result.setToolTipText(tooltip);
        if (initialValue != null) result.setText(initialValue);


        panel.add(label, "0, 0, r, c");        
        panel.add(result, "1, 0, f, c");

        if (suffix.length() != 0)
        {
            JLabel suffixLabel = new JLabel(" " + suffix);
            panel.add(suffixLabel, "2,0, l, c");
        }
            
        
        if (debug == true)
        panel.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(Color.red),
                panel.getBorder()));
        
        container.add(panel, placement);
        return result;
    }

    /**
     * Add a new Password Text Field
     * 
     * @param container - parent container
     * @param name - name of text field
     * @param initialValue - initial value of text field
     * @param mnemonic - mnemonic key
     * @param tooltip - tool tip for field
     * @param suffix - suffix text for field
     * @param labelWidth - label width 
     * @param placement - TableLayout placement
     * @param debug - turn on/off red debug borders
     * @return JPasswordField
     */
    public static JPasswordField addPasswordField(Container container, String name,
            String initialValue, int mnemonic, String tooltip, 
            String suffix, double labelWidth, String placement, boolean debug)
    {

        double[][] size = null;
        
        JPanel panel = new JPanel();
        panel.setOpaque(false);
        
        if (suffix.equals(""))
            size = new double[][]{{labelWidth,TableLayout.FILL},{30}};
        else
            size = new double[][] 
                   {{labelWidth,TableLayout.FILL, TableLayout.PREFERRED},{30}};
     
        TableLayout layout = new TableLayout(size);
        panel.setLayout(layout);       

        JLabel label = new JLabel(name);
        label.setDisplayedMnemonic(mnemonic);
        
        JPasswordField result = new JPasswordField(20);
        label.setLabelFor(result);
        label.setOpaque(false);
        result.setToolTipText(tooltip);
        if (initialValue != null) result.setText(initialValue);


        panel.add(label, "0, 0, r, c");        
        panel.add(result, "1, 0, f, c");

        if (suffix.length() != 0)
        {
            JLabel suffixLabel = new JLabel(" " + suffix);
            panel.add(suffixLabel, "2,0, l, c");
        }
            
        
        if (debug == true)
        panel.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(Color.red),
                panel.getBorder()));
        
        container.add(panel, placement);
        return result;
    }

    /**
     * Add a TextArea that has scrolling functionality
     * 
     * @param container - parent container
     * @param name - name of text area
     * @param text - text to put in text area
     * @param mnemonic - mnemonic key
     * @param placement - TableLayout placement in parent container
     * @param debug - turn on/off red debug borders
     * @return JTextArea
     */
    public static JTextArea addScrollingTextArea(Container container, String name, 
            String text, int mnemonic, String placement, boolean debug)
    {
        JPanel panel = new JPanel();
        panel.setOpaque(false);
        
        double size[][] = {{TableLayout.FILL},{20, TableLayout.FILL}};
        TableLayout layout = new TableLayout(size);
        panel.setLayout(layout);
        
        JTextArea textArea = new JTextArea();
        textArea.setLineWrap(true);
        textArea.setOpaque(true);
        
        JScrollPane areaScrollPane = new JScrollPane(textArea);
        areaScrollPane.
            setVerticalScrollBarPolicy(JScrollPane.VERTICAL_SCROLLBAR_AS_NEEDED);
        
        if (debug == true)
        panel.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(Color.red),
                panel.getBorder()));
        
        if (!name.equals(""))
        {
            JLabel label = new JLabel(name);
            label.setOpaque(false);
            label.setDisplayedMnemonic(mnemonic);
            panel.add(label, "0, 0, l, c");
            panel.add(areaScrollPane, "0, 1, f, f");
        } else {
            panel.add(areaScrollPane, "0, 0, 0, 1");            
        }
        

        container.add(panel, placement);
        
        return textArea;
    }
    
    /**
     * Basic Button not using TableLayout
     * 
     * @param name button name
     * @param image button image
     * @param tooltip button tool tip
     * @return button
     */
    public static JButton addBasicButton(String name, String image, String tooltip)
    {
        JButton button = null;

        if (image == null) 
        {
            button = new JButton(name);
        } else {
            java.net.URL imgURL = GuiImporter.class.getResource(image);
            if (imgURL != null)
            {
                button = new JButton(name, new ImageIcon(imgURL));
            } else {
                button = new JButton(name);
                log.warn("Couldn't find icon: " + image);
            }
        }
        button.setToolTipText(tooltip);
        return button;
    }
    
    /**
     * Add a button
     * 
     * @param container - parent container
     * @param label - button label
     * @param mnemonic - button mnemonic
     * @param tooltip - button tool tip
     * @param placement - TableLayout placement in parent container
     * @param debug - turn on/off red debug borders
     * @return JButton
     */
    public static JButton addButton(Container container, String label,
            int mnemonic, String tooltip, String placement, boolean debug)
    {
        JButton button = new JButton(label);
        button.setMnemonic(mnemonic);
        button.setToolTipText(tooltip);
        button.setOpaque(!getIsMac());
        container.add(button, placement);
        
        if (debug == true)
            button.setBorder(BorderFactory.createCompoundBorder(
                    BorderFactory.createLineBorder(Color.red),
                    button.getBorder()));
        
        return button;
    }
    
    /**
     * Add a button with an icon in it
     * 
     * @param container - parent container
     * @param label - button label
     * @param image - button image
     * @param width - button width
     * @param height - button height
     * @param mnemonic - button mnemonic
     * @param tooltip - tool tip for button
     * @param placement - TableLayout placement in parent container
     * @param debug - turn on/off red debug borders
     * @return JButton with image
     */
    public static JButton addIconButton(Container container, String label, String image,
            Integer width, Integer height, Integer mnemonic, String tooltip, String placement, 
            boolean debug)
    {
        JButton button = null;
        
        if (image == null) 
        {
            button = new JButton(label);
        } else {
            java.net.URL imgURL = GuiImporter.class.getResource(image);
            if (imgURL != null && label.length() > 0)
            {
                button = new JButton(label, new ImageIcon(imgURL));
            } else if (imgURL != null)
            {
                button = new JButton(null, new ImageIcon(imgURL));
            } else {
                button = new JButton(label);
                log.error("Couldn't find icon: " + image);
            }
        }
        
        if (width != null && height != null && width > 0 && height > 0)
        {
        	button.setMaximumSize(new Dimension(width, height));
        	button.setPreferredSize(new Dimension(width, height));
        	button.setMinimumSize(new Dimension(width, height));
        	button.setSize(new Dimension(width, height));
        }
        
        if (mnemonic != null) button.setMnemonic(mnemonic);
        button.setOpaque(!getIsMac());
        button.setToolTipText(tooltip);
        container.add(button, placement);
        if (isMotif() == true) 
            {
                Border b = BorderFactory.createLineBorder(Color.gray);
                button.setMargin(new Insets(0,0,0,0)); 
                button.setBorder(b);
            }
        
        if (debug == true)
            button.setBorder(BorderFactory.createCompoundBorder(
                    BorderFactory.createLineBorder(Color.red),
                    button.getBorder()));
        
        return button;
    }

    /**
     * Fires a button click when using the enter key
     * 
     * @param button to press when enter is pressed
     */
    public static void enterPressesWhenFocused(JButton button) {

        button.registerKeyboardAction(
            button.getActionForKeyStroke(
                KeyStroke.getKeyStroke(KeyEvent.VK_SPACE, 0, false)), 
                KeyStroke.getKeyStroke(KeyEvent.VK_ENTER, 0, false), 
                JComponent.WHEN_FOCUSED);

        button.registerKeyboardAction(
            button.getActionForKeyStroke(
                KeyStroke.getKeyStroke(KeyEvent.VK_SPACE, 0, true)), 
                KeyStroke.getKeyStroke(KeyEvent.VK_ENTER, 0, true), 
                JComponent.WHEN_FOCUSED);

    }
    
    /**
     * Add a radio button (with label) to parent container 
     * 
     * @param container - parent container
     * @param label - radio button label
     * @param mnemonic - mnemonic for button
     * @param tooltip - button tool tip
     * @param placement - TableLayout placement of button in parent container
     * @param debug - turn on/off red debug borders
     * @return JRadioButton
     */
    public static JRadioButton addRadioButton(Container container, String label, 
            int mnemonic, String tooltip, String placement, boolean debug)
    {
        JRadioButton button = new JRadioButton(label);
        button.setToolTipText(tooltip);
        container.add(button, placement);  
        button.setOpaque(false);
        return button;
        
    }

    /**
     * Add a check box (with label) to parent container 
     * 
     * @param container - parent container
     * @param label - check box label
     * @param placement - TableLayout placement in parent container
     * @param debug - turn on/off red debug borders
     * @return JCheckBox
     */
    public static JCheckBox addCheckBox(Container container, 
            String label, String placement, boolean debug)
    {
        JCheckBox checkBox = new JCheckBox(label);
        container.add(checkBox, placement);
        checkBox.setOpaque(false);
        return checkBox;
    }
    
    /**
     * Add a combo box (with label) to parent container
     * 
     * @param container - parent container
     * @param label - combo box label
     * @param initialValues - initial value for combo box
     * @param mnemonic - combo box mnemonic
     * @param tooltip - tool tip for combo box
     * @param labelWidth - width of label
     * @param placement - TableLayout placement in parent container
     * @param debug - turn on/off red debug borders
     * @return JComboBox
     */
    public static JComboBox addComboBox(Container container, String label,
         Object[] initialValues, int mnemonic, String tooltip, 
         double labelWidth, String placement, boolean debug)
    {
        JPanel panel = new JPanel();
        panel.setOpaque(false);
        
        double size[][] = {{labelWidth,TableLayout.FILL},{TableLayout.PREFERRED}};
        TableLayout layout = new TableLayout(size);
        panel.setLayout(layout);

        JLabel labelTxt = new JLabel(label);
        labelTxt.setDisplayedMnemonic(mnemonic);
        panel.add(labelTxt, "0,0,L,C");

        JComboBox result = null;
        if (initialValues != null)
        {
            result = new JComboBox(initialValues);
        } else {
            result = new JComboBox();
        }
        labelTxt.setLabelFor(result);
        result.setToolTipText(tooltip);
        panel.add(result, "1,0,F,C");
        container.add(panel, placement);
        result.setOpaque(false);
        return result;
    }
    
    /**
     * Small helper class to return an imageIcon from a string path
     * 
     * @param path - imgURL path string
     * @return ImageIcon from path
     */
    public static ImageIcon getImageIcon(String path)
    {
        java.net.URL imgURL = GuiImporter.class.getResource(path);
        
        if (imgURL != null) 
        { 
        	return new ImageIcon(imgURL); 
        } 
        else 
        { 
        	log.error("Couldn't find icon: " + imgURL); 
        }
        return null;
    }

    /**
     * Quit Confirmation pop up dialog
     * 
     * @param parent - parent component
     * @param message - message to use instead of default
     * @return boolean if quit (true) or cancel dialog (false)
     */
    public static boolean quitConfirmed(Component parent, String message) {
        if (message == null)
        {
            message = "Do you really want to quit?\n" +
            "Doing so will cancel any running imports.";
        }
        String s1 = "Quit";
        String s2 = "Don't Quit";
        Object[] options = {s1, s2};
        int n = JOptionPane.showOptionDialog(parent,
                message,
                "Quit Confirmation",
                JOptionPane.YES_NO_OPTION,
                JOptionPane.QUESTION_MESSAGE,
                null,
                options,
                s1);
        if (n == JOptionPane.YES_OPTION) {
            return true;
        } else {
            return false;
        }
    }
    
    /**
     * Pop-up a restart notification dialog
     * 
     * @param frame - parent frame
     * @param message - custom message to use instead of default supplied
     */
    public static void restartNotice(Component frame, String message) {
        if (message == null)
        {
            message = "You must restart before your changes will take effect.";
        }
        JOptionPane.showMessageDialog(frame, message);
    }
    
    
    /**
     * Validate if entered email is in the correct form.
     * 
     * @param emailAddress - email to validate
     * @return return true or false
     */
    public static boolean validEmail(String emailAddress)
    {
        String[] parts = emailAddress.split("@");
        if (parts.length == 2 && parts[0].length() != 0 && parts[1].length() != 0)
            return true;
        else
            return false;
    }
    
    /**
     * Add a whole number field to the parent container
     * 
     * @param container - parent container 
     * @param prefexStr - prefix text for field
     * @param initialValue - intial field value
     * @param suffexStr - suffex for field
     * @param mnemonic - accellerator key menonic
     * @param tooltip - tool tip for field
     * @param maxChars - maximum characters in field
     * @param fieldWidth - width of field
     * @param placement - TableLayout placement of field in parent container
     * @param debug - red debug border on/off
     * @return WholeNumberField
     */
    public static WholeNumberField addWholeNumberField(Container container, String prefexStr,
            String initialValue, String suffexStr, int mnemonic, String tooltip,
            int maxChars, int fieldWidth, String placement, boolean debug)
    {
        JPanel panel = new JPanel();
        panel.setOpaque(false);
        
        double table[][] = 
            {{TableLayout.PREFERRED, fieldWidth, 5, TableLayout.PREFERRED}, // columns
            {TableLayout.PREFERRED}}; // rows 
        
        TableLayout layout = new TableLayout(table);
        panel.setLayout(layout);  

        JLabel prefex = new JLabel(prefexStr);
        prefex.setDisplayedMnemonic(mnemonic);
        panel.add(prefex,"0,0");

        WholeNumberField result = new WholeNumberField(0, maxChars);
        result.setHorizontalAlignment(JTextField.CENTER);
        prefex.setLabelFor(result);
        result.setToolTipText(tooltip);
        if (initialValue != null) result.setText(initialValue);

        panel.add(result,"1,0");

        JLabel suffex = new JLabel(suffexStr);
        panel.add(suffex,"3,0");
        
        container.add(panel, placement);
        
        return result;
    }
    
    /**
     * Create a text field that only holds whole numbers
     * 
     * @author Brian Loranger brain at lifesci.dundee.ac.uk
     */
    public static class WholeNumberField extends JTextField {

        /**
         * 
         */
        private static final long serialVersionUID = 1L;
        private Toolkit toolkit;
        private NumberFormat integerFormatter;

        /**
         * New WholeNumber field containing value
         * @param value - value to set
         * @param columns - columns
         */
        public WholeNumberField(int value, int columns) {
            super(columns);
            toolkit = Toolkit.getDefaultToolkit();
            integerFormatter = NumberFormat.getNumberInstance(Locale.US);
            integerFormatter.setParseIntegerOnly(true);
            setValue(value);
        }

        /**
         * get value from field
         * @return - value
         */
        public int getValue() {
            int retVal = 0;
            try {
                retVal = integerFormatter.parse(getText()).intValue();
            } catch (ParseException e) {
            	// Capture and ignore these
                // This should never happen because insertString allows
                // only properly formatted data to get in the field.
                // log.error(e);
            }
            return retVal;
        }

        /**
         * set value on field
         * 
         * @param value
         */
        public void setValue(int value) {
            setText(integerFormatter.format(value));
        }

        /* (non-Javadoc)
         * @see javax.swing.JTextField#createDefaultModel()
         */
        protected Document createDefaultModel() {
            return new WholeNumberDocument();
        }

        /**
         * 
         * @author Brian Loranger brain at lifesci.dundee.ac.uk
         */
        protected class WholeNumberDocument extends PlainDocument {

            private static final long serialVersionUID = 1L;

            /* (non-Javadoc)
             * @see javax.swing.text.PlainDocument#insertString(int, java.lang.String, javax.swing.text.AttributeSet)
             */
            public void insertString(int offs, String str, AttributeSet a) 
            throws BadLocationException {

                char[] source = str.toCharArray();
                char[] result = new char[source.length];
                int j = 0;

                for (int i = 0; i < result.length; i++) {
                    if (Character.isDigit(source[i]))
                    {
                        result[j++] = source[i];
                    }
                    else {
                        toolkit.beep();
                    }
                }
                super.insertString(offs, new String(result, 0, j), a);


            }

        }

    }
    
    /**
     * Add a text field that only allows decimal numbers to be entered
     * 
     * @param container - parent container
     * @param prefexStr - prefix string for the text field
     * @param initialValue - initial decimal value
     * @param suffexStr - suffix string for the text field
     * @param mnemonic - accellerator key nmemonic
     * @param tooltip - tooltip for the field
     * @param maxChars - max length for the field
     * @param fieldWidth - width for the field
     * @param placement - TableLayout placement in parent container
     * @param debug - turn debug red borders on/off
     * @return DecimalNumberField
     */
    public static DecimalNumberField addDecimalNumberField(Container container, String prefexStr,
            String initialValue, String suffexStr, int mnemonic, String tooltip,
            int maxChars, int fieldWidth, String placement, boolean debug)
    {
        JPanel panel = new JPanel();
        panel.setOpaque(false);
        
        double table[][] = 
            {{TableLayout.PREFERRED, fieldWidth, 5, TableLayout.PREFERRED}, // columns
            {TableLayout.PREFERRED}}; // rows 
        
        TableLayout layout = new TableLayout(table);
        panel.setLayout(layout);  

        JLabel prefex = new JLabel(prefexStr);
        prefex.setDisplayedMnemonic(mnemonic);
        panel.add(prefex,"0,0");

        DecimalNumberField result = new DecimalNumberField(null, maxChars);
        result.setHorizontalAlignment(JTextField.CENTER);
        prefex.setLabelFor(result);
        result.setToolTipText(tooltip);
        if (initialValue != null) result.setText(initialValue);

        panel.add(result,"1,0");

        JLabel suffex = new JLabel(suffexStr);
        panel.add(suffex,"3,0");
        
        container.add(panel, placement);
        
        return result;
    }
    
    /**
     * 
     * @author Brian Loranger brain at lifesci.dundee.ac.uk
     */
    public static class DecimalNumberField extends JTextField {

        /**
         * 
         */
        private static final long serialVersionUID = 1L;
        private Toolkit toolkit;
        private NumberFormat formatter;

        /**
         * Set decimal field value
         * 
         * @param value - value to set
         * @param columns - number of decimal places
         */
        public DecimalNumberField(Double value, int columns) 
        {
            super(columns);
            toolkit = Toolkit.getDefaultToolkit();
            formatter = NumberFormat.getNumberInstance(Locale.US);
            formatter.setParseIntegerOnly(false);
            setValue(value);
        }

        /**
         * Retrieve the text field's value
         * @return
         */
        public Double getValue() 
        {
            Double retVal = null;
            try 
            {
                retVal = formatter.parse(getText()).doubleValue();
            } catch (ParseException e) 
            {
            	// Capture and ignore these
                // This should never happen because insertString allows
                // only properly formatted data to get in the field.
                // log.error(e);
            }
            return retVal;
        }

        /**
         * Set the text field's value
         * 
         * @param value
         */
        public void setValue(Double value) 
        {
            if (value != null)
                setText(formatter.format(value));
        }

        /* (non-Javadoc)
         * @see javax.swing.JTextField#createDefaultModel()
         */
        protected Document createDefaultModel() 
        {
            return new DecimalNumberDocument();
        }

        /**
         * 
         * @author Brian Loranger brain at lifesci.dundee.ac.uk
         */
        protected class DecimalNumberDocument extends PlainDocument {

            /**
             * 
             */
            private static final long serialVersionUID = 1L;

            /* (non-Javadoc)
             * @see javax.swing.text.PlainDocument#insertString(int, java.lang.String, javax.swing.text.AttributeSet)
             */
            public void insertString(int offs, String str, AttributeSet a) 
            throws BadLocationException 
            {

                char[] source = str.toCharArray();
                char[] result = new char[source.length];
                int j = 0;

                for (int i = 0; i < result.length; i++) 
                {
                    if (Character.isDigit(source[i]) || Character.toString(source[i]).equals("."))
                    {
                        result[j++] = source[i];
                    }
                    else {
                        toolkit.beep();
                    }
                }
                super.insertString(offs, new String(result, 0, j), a);
            }
        }
    }
    
    /**
     * Add an image panel to the parent container
     * 
     * @param container - parent container
     * @param imageString - string to use for imgURL
     * @param placement - TableLayout placement of panel within parent
     * @param debug - turn on/off red debug borders
     * @return image JPanel
     */
    public static JPanel addImagePanel(JPanel container, String imageString,
            String placement, boolean debug)
    {
        ImageIcon icon = null;
        java.net.URL imgURL = GuiImporter.class.getResource(imageString);
        if (imgURL != null)
        {
            icon = new ImageIcon(imgURL);
        }
        JPanel panel = new ImagePanel(icon);
        
        if (debug == true)
            panel.setBorder(BorderFactory.createCompoundBorder(
                    BorderFactory.createLineBorder(Color.red),
                    panel.getBorder()));
        else 
            panel.setBorder(BorderFactory.createCompoundBorder(
                    BorderFactory.createLineBorder(Color.gray),
                    panel.getBorder()));            
        
        container.add(panel, placement);
        
        return panel;
    }
    

    /**
     * Extended JPanel for holding images
     * 
     * @author Brian Loranger brain at lifesci.dundee.ac.uk
     */
    public static class ImagePanel extends JPanel
    {
        private static final long serialVersionUID = 1L;
        ImageIcon image;
    
        /**
         * Icon image to use for this JPanel
         * 
         * @param icon
         */
        public ImagePanel(ImageIcon icon)
        {
            super();
            this.image = icon;
        }
        
        /* (non-Javadoc)
         * @see javax.swing.JComponent#paintComponent(java.awt.Graphics)
         */
        public void paintComponent(Graphics g)
        {
            super.paintComponent(g);
            if(image != null)
            {
                g.drawImage(image.getImage(), 0, 0, this);
            }
        }
    }
    
}


