import React, { useState, useRef, useEffect } from 'react';
import { Tv, Volume2, VolumeX, Maximize2, RefreshCw, Radio, ChevronLeft, ChevronRight } from 'lucide-react';

interface Channel {
    id: string;
    name: string;
    shortName: string;
    youtubeId: string;
    videoId: string;
    logo: string;
    color: string;
    region: string;
    category: string;
}

// Live stream channel list with confirmed current Video IDs to bypass Error 153
// Live stream channel list with verified UC... IDs for 100% stable /live_stream embedding
export const CHANNELS: Channel[] = [
    {
        id: 'bloomberg',
        name: 'Bloomberg Television',
        shortName: 'Bloomberg',
        youtubeId: 'UCIALMKvObZNtJ6AmdCLP7Lg',
        videoId: '', 
        logo: 'https://www.google.com/s2/favicons?sz=64&domain=bloomberg.com',
        color: '#FF6600',
        region: 'Global',
        category: 'Finance'
    },
    {
        id: 'cnbc',
        name: 'CNBC International',
        shortName: 'CNBC',
        youtubeId: 'UCvJJ_dzjViJCoLf5uKUTwoA',
        videoId: '',
        logo: 'https://www.google.com/s2/favicons?sz=64&domain=cnbc.com',
        color: '#0066FF',
        region: 'Global',
        category: 'Finance'
    },
    {
        id: 'livenowfox',
        name: 'LiveNOW from FOX',
        shortName: 'Fox News',
        youtubeId: 'UCJg9wBPyKMNA5sRDnvzmkdg',
        videoId: 'OrCH6XEzMwI', // Direct stable ID
        logo: 'https://www.google.com/s2/favicons?sz=64&domain=foxnews.com',
        color: '#003087',
        region: 'USA',
        category: 'News'
    },
    {
        id: 'skynews',
        name: 'Sky News Live',
        shortName: 'Sky News',
        youtubeId: 'UCoMdktPbSTixAyNGwb-UYkQ',
        videoId: 'YDvsBbKfLPA', // Direct stable ID
        logo: 'https://www.google.com/s2/favicons?sz=64&domain=sky.com',
        color: '#E00034',
        region: 'UK',
        category: 'News'
    },
    {
        id: 'euronews',
        name: 'Euronews English',
        shortName: 'Euronews',
        youtubeId: 'UCSrZ3UV4jOidv8ppoVuvW9Q',
        videoId: 'pykpO5kQJ98', // Direct stable ID
        logo: 'https://www.google.com/s2/favicons?sz=64&domain=euronews.com',
        color: '#00548F',
        region: 'Europe',
        category: 'News'
    },
    {
        id: 'dw',
        name: 'DW News Live',
        shortName: 'DW',
        youtubeId: 'UCknLrEdhRCp1aegoMqRaCZg',
        videoId: '',
        logo: 'https://www.google.com/s2/favicons?sz=64&domain=dw.com',
        color: '#D00000',
        region: 'Germany',
        category: 'News'
    },
    {
        id: 'france24',
        name: 'France 24 English',
        shortName: 'France 24',
        youtubeId: 'UCCCPCZNChQdGa9EkATeye4g',
        videoId: '',
        logo: 'https://www.google.com/s2/favicons?sz=64&domain=france24.com',
        color: '#E60019',
        region: 'France',
        category: 'News'
    },
    {
        id: 'aljazeera',
        name: 'Al Jazeera English',
        shortName: 'Al Jazeera',
        youtubeId: 'UCfiwzLy-8yKzIbsmZTzxDgw',
        videoId: '',
        logo: 'https://www.google.com/s2/favicons?sz=64&domain=aljazeera.com',
        color: '#009BB8',
        region: 'Global',
        category: 'News'
    },
    {
        id: 'alarabiya',
        name: 'Al Arabiya News',
        shortName: 'Al Arabiya',
        youtubeId: 'UCahpxixMCwoANAftn6IxkTg',
        videoId: '',
        logo: 'https://www.google.com/s2/favicons?sz=64&domain=alarabiya.net',
        color: '#C8102E',
        region: 'Arabic',
        category: 'Arabic'
    },
    {
        id: 'asharqnews',
        name: 'Asharq News',
        shortName: 'Asharq News',
        youtubeId: 'UCRJUVYt9gjg8MnlGacySUdg',
        videoId: '',
        logo: 'https://www.google.com/s2/favicons?sz=64&domain=asharq.com',
        color: '#000000',
        region: 'Arabic',
        category: 'Arabic'
    },
    {
        id: 'asharqbusiness',
        name: 'Asharq Business',
        shortName: 'Asharq Biz',
        youtubeId: 'UCxjpGbfoLy6oodYdiyzQE4g',
        videoId: '',
        logo: 'https://www.google.com/s2/favicons?sz=64&domain=asharq.com', 
        color: '#FFD700',
        region: 'Arabic',
        category: 'Finance'
    },
    {
        id: 'skynewsarabia',
        name: 'Sky News Arabia',
        shortName: 'Sky Arabia',
        youtubeId: 'UCIJXOvggjKtCagMfxvcCzAA',
        videoId: '',
        logo: 'https://www.google.com/s2/favicons?sz=64&domain=skynewsarabia.com',
        color: '#E00034',
        region: 'Arabic',
        category: 'Arabic'
    },
];

const LiveIntelligenceStreams: React.FC = () => {
    const [activeChannel, setActiveChannel] = useState<Channel>(CHANNELS[0]);
    const [isMuted, setIsMuted] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [filter, setFilter] = useState<string>('All');
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const categories = ['All', 'Finance', 'News', 'Arabic'];
    const filteredChannels = filter === 'All' ? CHANNELS : CHANNELS.filter(c => c.category === filter);

    const switchChannel = (channel: Channel) => {
        setIsLoading(true);
        setHasError(false);
        setActiveChannel(channel);
    };

    const handleRetry = () => {
        setIsLoading(true);
        setHasError(false);
        // Force iframe reload by toggling channel
        const current = activeChannel;
        setActiveChannel({ ...current });
    };

    const scrollChannels = (dir: 'left' | 'right') => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
        }
    };

    // Use specific Video ID if available to bypass Error 153 configuration issues
    // Fall back to live_stream?channel= only if videoId is empty
    const embedUrl = activeChannel.videoId 
        ? `https://www.youtube.com/embed/${activeChannel.videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=1&rel=0&modestbranding=1&enablejsapi=1&origin=${window.location.origin}`
        : `https://www.youtube.com/embed/live_stream?channel=${activeChannel.youtubeId}&autoplay=1&mute=${isMuted ? 1 : 0}&controls=1&rel=0&modestbranding=1&enablejsapi=1&origin=${window.location.origin}`;

    return (
        <div className="glass-card live-streams-card" style={{
            padding: 0,
            overflow: 'hidden',
            borderRadius: '16px',
            border: '1px solid var(--glass-border)',
            marginBottom: '1.5rem',
            background: 'rgba(5, 5, 15, 0.8)'
        }}>
            {/* Header */}
            <div style={{
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--glass-border)',
                background: 'rgba(0,0,0,0.3)',
                flexWrap: 'wrap',
                gap: '0.5rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px', padding: '4px 10px'
                    }}>
                        <div className="pulse" style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#EF4444' }} />
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#EF4444', letterSpacing: '0.1em' }}>LIVE</span>
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                            <Tv size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                            Live Intelligence Streams
                        </h3>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', marginTop: '1px' }}>
                            {activeChannel.name} • {activeChannel.region}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {/* Category Filter */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilter(cat)}
                                style={{
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    border: `1px solid ${filter === cat ? activeChannel.color : 'var(--glass-border)'}`,
                                    background: filter === cat ? `${activeChannel.color}20` : 'transparent',
                                    color: filter === cat ? activeChannel.color : 'var(--color-text-tertiary)',
                                    cursor: 'pointer',
                                    letterSpacing: '0.05em'
                                }}
                            >
                                {cat.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        title={isMuted ? 'Unmute' : 'Mute'}
                        style={{
                            background: isMuted ? 'rgba(255,255,255,0.05)' : 'rgba(99, 102, 241, 0.15)',
                            border: `1px solid ${isMuted ? 'var(--glass-border)' : 'var(--color-accent)'}`,
                            borderRadius: '8px', padding: '6px 8px', cursor: 'pointer',
                            color: isMuted ? 'var(--color-text-tertiary)' : 'var(--color-accent)',
                            display: 'flex', alignItems: 'center'
                        }}
                    >
                        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>
                    <button
                        onClick={handleRetry}
                        title="Reload stream"
                        style={{
                            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                            borderRadius: '8px', padding: '6px 8px', cursor: 'pointer',
                            color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center'
                        }}
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* Main Video Player */}
            <div style={{ position: 'relative', paddingBottom: '40%', background: '#000', minHeight: '240px' }}>
                {isLoading && (
                    <div style={{
                        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: '1rem',
                        background: 'rgba(0,0,0,0.8)', zIndex: 2
                    }}>
                        <Radio size={32} color={activeChannel.color} className="pulse" />
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                            Connecting to {activeChannel.name}...
                        </div>
                        <div style={{
                            width: '160px', height: '3px', background: 'rgba(255,255,255,0.1)',
                            borderRadius: '2px', overflow: 'hidden'
                        }}>
                            <div style={{
                                height: '100%', width: '60%', background: activeChannel.color,
                                borderRadius: '2px', animation: 'scan-progress 1.5s ease-in-out infinite'
                            }} />
                        </div>
                    </div>
                )}

                {hasError && (
                    <div style={{
                        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: '1rem', background: '#000', zIndex: 2
                    }}>
                        <Tv size={48} color="rgba(255,255,255,0.2)" />
                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '0 2rem' }}>
                            Stream temporarily unavailable.<br />
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                This channel may have restricted embedding.
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={handleRetry}
                                className="glass-button"
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '8px 14px', borderRadius: '8px' }}
                            >
                                <RefreshCw size={14} /> Retry
                            </button>
                            <a
                                href={`https://www.youtube.com/channel/${activeChannel.youtubeId}/live`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    fontSize: '0.8rem', padding: '8px 14px', borderRadius: '8px',
                                    background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)',
                                    color: '#FF4444', textDecoration: 'none', fontWeight: 600
                                }}
                            >
                                <Maximize2 size={14} /> Open on YouTube
                            </a>
                        </div>
                    </div>
                )}

                <iframe
                    ref={iframeRef}
                    key={activeChannel.id}
                    src={embedUrl}
                    style={{
                        position: 'absolute', top: 0, left: 0,
                        width: '100%', height: '100%', border: 'none'
                    }}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    title={activeChannel.name}
                    onLoad={() => { setIsLoading(false); }}
                    onError={() => { setIsLoading(false); setHasError(true); }}
                />
            </div>

            {/* Channel Selector Strip */}
            <div style={{
                padding: '0.75rem',
                borderTop: '1px solid var(--glass-border)',
                background: 'rgba(0,0,0,0.3)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                        onClick={() => scrollChannels('left')}
                        style={{
                            flexShrink: 0, background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--glass-border)', borderRadius: '6px',
                            padding: '5px', cursor: 'pointer', color: 'var(--color-text-tertiary)',
                            display: 'flex', alignItems: 'center'
                        }}
                    >
                        <ChevronLeft size={14} />
                    </button>

                    <div
                        ref={scrollRef}
                        style={{
                            display: 'flex', gap: '0.5rem', overflowX: 'auto',
                            scrollbarWidth: 'none', flex: 1, flexWrap: 'nowrap',
                            msOverflowStyle: 'none'
                        }}
                    >
                        {filteredChannels.map(channel => {
                            const isActive = channel.id === activeChannel.id;
                            return (
                                <button
                                    key={channel.id}
                                    onClick={() => switchChannel(channel)}
                                    style={{
                                        flex: '0 0 auto',
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                                        border: `1px solid ${isActive ? channel.color : 'var(--glass-border)'}`,
                                        background: isActive ? `${channel.color}20` : 'rgba(255,255,255,0.02)',
                                        color: isActive ? channel.color : 'var(--color-text-secondary)',
                                        fontWeight: isActive ? 800 : 500,
                                        fontSize: '0.75rem',
                                        transition: 'all 0.2s ease',
                                        boxShadow: isActive ? `0 0 12px ${channel.color}30` : 'none',
                                        whiteSpace: 'nowrap',
                                        minWidth: 'fit-content'
                                    }}
                                >
                                    <div style={{
                                        width: '18px', height: '18px', borderRadius: '4px',
                                        background: 'white', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
                                        padding: '1px', border: '1px solid rgba(0,0,0,0.1)'
                                    }}>
                                        <img 
                                            src={channel.logo} 
                                            alt={channel.shortName}
                                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).parentElement!.innerText = channel.shortName[0];
                                            }}
                                        />
                                    </div>
                                    {channel.shortName}
                                    {isActive && (
                                        <div className="pulse" style={{
                                            width: '5px', height: '5px', borderRadius: '50%',
                                            background: channel.color, flexShrink: 0
                                        }} />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => scrollChannels('right')}
                        style={{
                            flexShrink: 0, background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--glass-border)', borderRadius: '6px',
                            padding: '5px', cursor: 'pointer', color: 'var(--color-text-tertiary)',
                            display: 'flex', alignItems: 'center'
                        }}
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>

                {/* Direct Link Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <a
                        href={`https://www.youtube.com/channel/${activeChannel.youtubeId}/live`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            fontSize: '0.65rem', color: 'var(--color-text-tertiary)',
                            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px'
                        }}
                    >
                        <Maximize2 size={10} /> Open {activeChannel.shortName} in YouTube
                    </a>
                </div>
            </div>

            <style>{`
                @keyframes scan-progress {
                    0% { transform: translateX(-100%); }
                    50% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                .live-streams-card::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
};

export default LiveIntelligenceStreams;
