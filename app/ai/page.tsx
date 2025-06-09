'use client';

import { useState } from 'react';
import { runFlow, streamFlow } from '@genkit-ai/next/client';
import { menuSuggestionFlow } from '@/genAi/genkit/menuSuggestionFlow';
import { Button } from '@/components/ui/button';

export default function Home() {
    const [menuItem, setMenuItem] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [streamedText, setStreamedText] = useState<string>('');

    async function getMenuItem(formData: FormData) {
        const theme = formData.get('theme')?.toString() ?? '';
        setIsLoading(true);

        try {
            // Regular (non-streaming) approach
            const result = await runFlow<typeof menuSuggestionFlow>({
                url: '/api/menuSuggestion',
                input: { theme },
            });

            setMenuItem(result.menuItem);
        } catch (error) {
            console.error('Error generating menu item:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function streamMenuItem(formData: FormData) {
        const theme = formData.get('theme')?.toString() ?? '';
        setIsLoading(true);
        setStreamedText('');

        try {
            // Streaming approach
            const result = streamFlow<typeof menuSuggestionFlow>({
                url: '/api/menuSuggestion',
                input: { theme },
            });

            // Process the stream chunks as they arrive
            for await (const chunk of result.stream) {
                setStreamedText((prev) => prev + chunk);
            }

            // Get the final complete response
            const finalOutput = await result.output;
            setMenuItem(finalOutput.menuItem);
        } catch (error) {
            console.error('Error streaming menu item:', error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <main>
            <form action={getMenuItem}>
                <label htmlFor="theme">Suggest a menu item for a restaurant with this theme: </label>
                <input type="text" name="theme" id="theme" />
                <br />
                <br />
                <Button type="submit" disabled={isLoading}>
                    Generate
                </Button>
                <Button
                    type="button"
                    disabled={isLoading}
                    onClick={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget.form!);
                        streamMenuItem(formData);
                    }}
                >
                    Stream Generation
                </Button>
            </form>
            <br />

            {streamedText && (
                <div>
                    <h3>Streaming Output:</h3>
                    <pre>{streamedText}</pre>
                </div>
            )}

            {menuItem && (
                <div>
                    <h3>Final Output:</h3>
                    <pre>{menuItem}</pre>
                </div>
            )}
        </main>
    );
}