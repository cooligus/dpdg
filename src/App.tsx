import { useState } from 'react'
import './App.css'
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { z } from "zod"
import { useForm } from 'react-hook-form'

interface Character {
  name: string;
  scriptPrefix: string;
  contentPrefix: string;
}

interface Dialog {
  user: Character;
  span: number;
  content: string;
}

interface ScriptData {
  name: string;
  initialCounter: number;
  initialSpan: number;
}

// TODO: finish
const FormSchema = z.object({
  users: z.array(z.object({
    name: z.string(),
    scriptPrefix: z.string(),
    contentPrefix: z.string(),
  })).min(2, {
    message: "Username must be at least 2 characters.",
  }),
})

const App = () => {
  const [users, setUsers] = useState<Character[]>([
    { name: 'Wieseik', scriptPrefix: 'W', contentPrefix: 'Wiesiek: ' }
  ]);
  const [dialogues, setDialogues] = useState<Dialog[]>([]);
  const [finalScript, setFinalScript] = useState<string>('');
  const [rawScript, setRawScript] = useState<string>('');
  const [scriptData, setScriptData] = useState<ScriptData>({ name: '', initialCounter: 1, initialSpan: 10 });

  const getSpanFromLine = (line: string): number => {
    const trimmedLine = line.trim();
    const characterMultiplier = 4;
    const occurences = trimmedLine.match(/[A-Za-z]+/g);
    return occurences ? occurences.length * characterMultiplier : 0;
  };

  const parseDialogueOnClick = () => {
    const parsedDialogues = parseDialogue(rawScript);
    setDialogues(parsedDialogues);
  };

  const parseDialogue = (dialogueString: string): Dialog[] => {
    const dialogueLines = dialogueString.split('\n');
    const dialogues: Dialog[] = [];

    for (const line of dialogueLines) {
      const match = line.match(/^([A-Za-z]+): (.*)$/);
      if (match) {
        const speaker = match[1];
        const content = match[2];
        const span = getSpanFromLine(line);

        const caseInsensitiveSpeaker = speaker.toLowerCase();

        const user = users.find((user) => user.scriptPrefix.toLowerCase() === caseInsensitiveSpeaker);
        if (user) {
          dialogues.push({ user, span, content });
        } else {
          console.error(`Unknown speaker: ${caseInsensitiveSpeaker}`);
        }
      } else {
        if (dialogues.length > 0) {
          dialogues[dialogues.length - 1].content += '\n' + line;
        } else {
          console.error(`Invalid dialogue line: ${line}`);
        }
      }
    }

    return dialogues;
  };

  const getUserFromUsername = (username: string): Character | undefined => {
    return users.find((user) => user.name === username);
  };

  const getScriptIncrementer = (): string => {
    return `scoreboard players add @s ${scriptData.name} ${scriptData.initialCounter}\n`;
  };

  const getSingleDialog = (incrementer: number, dialog: Dialog): string => {
    const contentPrefix = dialog.user.contentPrefix;
    return `execute if score @s ${scriptData.name} matches ${incrementer} run tellraw @a [${contentPrefix}, {"text":"${dialog.content}", "italic": true, "color":"gray", "bold": "false"}]\n`;
  };

  const getScriptFinalStatement = (incrementer: number): string => {
    return `execute if score @s ${scriptData.name} matches ${incrementer}.. run scoreboard players set @s ${scriptData.name} -1\n`;
  };

  const addDialogue = (userName: string) => {
    const user = getUserFromUsername(userName);
    if (!user) {
      console.error(`User ${userName} not found`);
      return;
    }
    setDialogues((prevDialogues) => [...prevDialogues, { user, span: 0, content: '' }]);
  };

  const generateDialogues = () => {
    const initialScriptContent = getScriptIncrementer();
    let realScriptContent = '';
    let conversationSpan = scriptData.initialSpan;
    for (let i = 0; i < dialogues.length; i++) {
      realScriptContent += getSingleDialog(conversationSpan, dialogues[i]);
      conversationSpan += dialogues[i].span;
    }
    const endingScriptContent = getScriptFinalStatement(conversationSpan);
    const wholeScriptContent = initialScriptContent + realScriptContent + endingScriptContent;
    setFinalScript(wholeScriptContent);
  };
  const onSubmit = (data: any) => {
    console.log(data);
  };
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: "",
    },
  })
  
  return (
    <>
<Textarea className="min-h-[3em]" onChange={(e) => setRawScript(e.target.value)}/>
<Button onClick={parseDialogueOnClick}>Import dialogues</Button>

<Input />

<Collapsible>
	<CollapsibleTrigger>Users</CollapsibleTrigger>
	<CollapsibleContent>
    {users.map((user, index) => (
			<div className="flex flex-row" key={index}>
				<Input value={user.name} onChange={(e) => users[index].name = e.target.value}/>
				<Input value={user.scriptPrefix} onChange={(e) => users[index].scriptPrefix = e.target.value}/>
				<Input value={user.contentPrefix} onChange={(e) => users[index].contentPrefix = e.target.value} />
			</div>
    ))}
		<Button
			onClick={() =>
        setUsers((prevUsers) => [...prevUsers, { name: '', scriptPrefix: '', contentPrefix: '' }])}
			>New user</Button>
	</CollapsibleContent>
</Collapsible>

{dialogues.map((dialogue, index) => (<div key={index}>
	<Input value={dialogue.content} />
	<div className="flex flex-row">
		{dialogue.user.name}
		<Input type="number" className="w-[7em]" value={dialogue.span / 20} onChange={(e) => dialogues[index].span = e.target.valueAsNumber * 20}/>
		<Input type="number" className="w-[7em]" value={dialogue.span} onChange={(e) => dialogues[index].span = e.target.valueAsNumber}/>
	</div>
</div>))}

{users.map((user, index) => (
	<Button key={index} onClick={() => addDialogue(user.name)}>+ {user.name}</Button>
))}
<Button onClick={generateDialogues}>Generate dialogues</Button>
<Textarea value={finalScript} className="min-h-[30em]" onChange={(e) => setFinalScript(e.target.value)} />

    </>
  )
}

export default App
